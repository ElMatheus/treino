// Copyright (c) 2025, Adolfo and contributors
// For license information, please see license.txt


frappe.ui.form.on("Ordem de Compra", {
  refresh(frm) {
    toggleAddRowButton(frm);

    if (frm.doc.fornecedor) {
      applyFornecedorFilter(frm);
    }
  },  

  async fornecedor(frm) {
    cleanItens(frm);  
    if (!frm.doc.fornecedor) {
      toggleAddRowButton(frm);
      return;
    }
    applyFornecedorFilter(frm);
  }
});


frappe.ui.form.on("Item Ordem de Compra", {
  async item(frm, cdt, cdn) {
    const linha = locals[cdt][cdn];
    const fornecedor = await frappe.db.get_doc('Fornecedor', frm.doc.fornecedor);
    const itemFornecedor = fornecedor.itens.find(i => i.item === linha.item);
    if (itemFornecedor) {
      const existe = verificarItemJaAdicionado(frm.doc.itens_fornecedor, linha);
      if (existe) {
        frm.get_field('itens_fornecedor').grid.grid_rows_by_docname[cdn].remove();
        frappe.throw(__('Este item já foi adicionado ao pedido.'));
      }
      linha.valor_pago = itemFornecedor.valor_total || 0;
      calculateValorTotal(linha);
      if (linha.lucro) {
        const sugerido = calcularPrecoOuLucro({ produto_preco: linha.valor_pago, lucroPercentual: linha.lucro });
        linha.preco_sugerido = sugerido;
      }
    }
    frm.refresh_fields();
  },

  quantidade(frm, cdt, cdn) {
    const linha = locals[cdt][cdn];
    calculateValorTotal(linha);
    frm.refresh_field("valor_total");
  },

  lucro(frm, cdt, cdn) {
    const linha = locals[cdt][cdn];
    const sugerido = calcularPrecoOuLucro({ produto_preco: linha.valor_pago, lucroPercentual: linha.lucro })
    linha.preco_sugerido = sugerido;
    frm.refresh_field("preco_sugerido");
  },

  preco_sugerido(frm, cdt, cdn) {
    const linha = locals[cdt][cdn];
    const lucro = calcularPrecoOuLucro({ produto_preco: linha.valor_pago, precoDeVenda: linha.preco_sugerido })
    linha.lucro = lucro;
    frm.refresh_field("lucro");
  },
});


const setChildFilters = (frm, tabela, campo, filters) => {
  if (!frm || !tabela || !campo || !filters) {
    console.error(
      `Parâmetros inválidos: \nRecebidos: frm: ${frm}, tabela: ${tabela}, campo: ${campo}, filters: ${filters}`
    );
    return;
  }

  const field = frm?.fields_dict[tabela]?.grid?.get_field(campo);

  if (!field) {
    console.error(`Campo ${campo} não encontrado.`);
    return;
  }

  field.get_query = function () {
    return {
      filters: filters,
    };
  };

};

const cleanItens = (frm) => {
  const linhasComItem = frm.doc.itens_fornecedor.filter(row => row.item);

  frm.doc.itens_fornecedor = linhasComItem;

  frm.refresh_field("itens_fornecedor");
}

const toggleAddRowButton = (frm) => {
  const grid = frm.fields_dict["itens_fornecedor"].grid;

  if (!frm.doc.fornecedor) {
    grid.wrapper.find('.grid-add-row').prop('disabled', true).addClass('btn-disabled');
    grid.wrapper.find('.grid-add-row').attr('title', 'Selecione um fornecedor para adicionar itens');
  } else {
    grid.wrapper.find('.grid-add-row').prop('disabled', false).removeClass('btn-disabled');
    grid.wrapper.find('.grid-add-row').attr('title', '');
  }
};

const calcularPrecoOuLucro = ({ produto_preco, lucroPercentual, precoDeVenda }) => {
  if (lucroPercentual !== undefined) {
    return produto_preco * (1 + lucroPercentual / 100);
  } else if (precoDeVenda !== undefined) {
    return ((precoDeVenda - produto_preco) / produto_preco) * 100;
  } else {
    throw new Error("Você precisa informar lucroPercentual ou precoDeVenda");
  }
};

const calculateValorTotal = (linha) => {
  const total = linha.valor_pago * linha.quantidade;
  linha.valor_total = total;
}

const verificarItemJaAdicionado = (itens, itemAtual) => {
  const existe = itens.some(produto => produto.item === itemAtual.item && produto.name !== itemAtual.name);
  return existe;
}

const applyFornecedorFilter = async (frm) => {
  const fornecedor = await frappe.db.get_doc('Fornecedor', frm.doc.fornecedor);
  const itens = fornecedor.itens.map(i => i.item);

  setChildFilters(
    frm,
    "itens_fornecedor",
    "item",
    {
      "name": ["in", itens]
    }
  );
  frm.refresh_field("itens_fornecedor");
  toggleAddRowButton(frm);
}
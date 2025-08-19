// // Copyright (c) 2025, Adolfo and contributors
// // For license information, please see license.txt

frappe.ui.form.on("Fornecedor", {
  cnpj(frm) {
    const rawCnpj = frm.doc.cnpj.toString();
    const cleanCnpj = rawCnpj.replace(/\D/g, '');
    if (cleanCnpj.length === 14) {
      const formatted = formatCpnj(cleanCnpj);
      if (rawCnpj !== formatted) {
        frm.set_value("cnpj", formatted);
      } else {
        frappe.call({
          method: "treino.treino.doctype.fornecedor.fornecedor.buscar_cnpj",
          args: { cnpj: cleanCnpj },
          callback(r) {
            if (r.message) {
              frm.set_value("fornecedor", r.message.company.name);
              const cep = r.message.address.zip;
              if (!frm.doc.cep) {
                frappe.call({
                  method: "treino.treino.doctype.fornecedor.fornecedor.buscar_cep",
                  args: { cep: cep},
                  callback(r) {
                    if (r.message.erro === "true") {
                      frappe.toast("Não foi possível encontrar os dados para o CEP informado.");
                      frm.set_value("endereco", '');
                      return;
                    }
                    frm.set_value("endereco", `${r.message.logradouro}, ${r.message.bairro}, ${r.message.localidade} - ${r.message.uf}`);
                    frm.set_value("cep", cep)
                  }
                });
              }
            } else {
              frm.set_value("fornecedor", '');
            }
          }
        });
      }
    }
  },

  cep(frm) {
    const cep = cleanCep(frm.doc.cep);
    if (cep) {
      frappe.call({
        method: "treino.treino.doctype.fornecedor.fornecedor.buscar_cep",
        args: { cep: cep },
        callback(r) {
          if (r.message.erro === "true") {
            frappe.toast("Não foi possível encontrar os dados para o CEP informado.");
            frm.set_value("endereco", '');
            return;
          }
          frm.set_value("endereco", `${r.message.logradouro}, ${r.message.bairro}, ${r.message.localidade} - ${r.message.uf}`);
          const structure = `${cep.slice(0, 5)}-${cep.slice(5)}`;
          frm.set_value("cep", structure)
        }
      });
    }
  }
});

frappe.ui.form.on("Itens Fornecedor", {
  async preco_fornecedor(frm, cdt, cdn) {
    const linha = locals[cdt][cdn];

    if (!linha.desconto) {
      linha.desconto = 0
      frm.refresh_field('desconto');
    }
  },

  desconto(frm, cdt, cdn) {
    const linha = locals[cdt][cdn];
    linha.desconto = Math.min(Math.max(linha.desconto || 0, 0), 100);
    frm.refresh_field('desconto');
  }
});

const formatCpnj = (cnpj) => {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
};

const cleanCep = (cep) => {
  cep = cep.toString().replace(/\D/g, '');

  if (cep.length === 8) {
    return cep;
  }
};

// Copyright (c) 2025, Adolfo and contributors
// For license information, please see license.txt

frappe.ui.form.on("Compra", {
    refresh(frm) {
        if (frm.doc.docstatus === 1) {
            let itens_data = feedItens(frm.doc.itens);
            frm.add_custom_button("Gerar Nota", function () {
                const d = new frappe.ui.Dialog({
                    title: "Selecione os itens que deseja incluir na Nota Fiscal.",
                    fields: [
                        {
                            label: "Itens da Nota",
                            fieldname: "itens_nota",
                            fieldtype: "Table",
                            cannot_add_rows: true,
                            cannot_delete_rows: true,
                            in_place_edit: false,
                            data: itens_data,
                            fields: [
                                {
                                    label: "Item",
                                    fieldname: "item",
                                    fieldtype: "Link",
                                    options: "Item",
                                    in_list_view: 1,
                                    read_only: 1,
                                },
                                {
                                    label: "Valor Unitário",
                                    fieldname: "valor_unitario",
                                    fieldtype: "Currency",
                                    in_list_view: 1,
                                    read_only: 1
                                },
                                {
                                    label: "Quantidade",
                                    fieldname: "quantidade",
                                    fieldtype: "Int",
                                    in_list_view: 1,
                                    read_only: 1
                                }
                            ]
                        }
                    ],
                    primary_action_label: "Confirmar",
                    primary_action(values) {
                        const itens_selecionados = values.itens_nota.filter(i => i.__checked);
                        frappe.call({
                            method: "treino.treino.doctype.compra.compra.criar_nota_fiscal",
                            args: { itensParam: itens_selecionados, compra: frm.doc.name },
                            callback: function (data) {
                                if (data.message) {
                                    frappe.set_route('Form', 'nota-fiscal', data.message);
                                }
                            }
                        });
                    }
                });
                d.show();
            }).addClass("btn-primary");
        };
        frm.toggle_display("historico_compra", !!frm.doc.cliente);
        frm.toggle_display("criar_cliente", !frm.doc.cliente);
    },

    cliente(frm) {
        frm.toggle_display("historico_compra", !!frm.doc.cliente);
        frm.toggle_display("criar_cliente", !frm.doc.cliente);
    },

    historico_compra(frm) {
        if (frm.doc.cliente) {
            frappe.set_route('List', 'Historico de Compra', {
                cliente: frm.doc.cliente
            })
        }
    },

    criar_cliente(frm) {
        const dialog = new frappe.ui.Dialog({
            title: 'Cadastrar novo cliente',
            fields: [
                {
                    fieldtype: 'Data',
                    fieldname: 'nome',
                    label: 'Nome do Cliente',
                    reqd: 1
                },
                {
                    fieldtype: 'Data',
                    fieldname: 'email',
                    label: 'Email'
                },
                {
                    fieldtype: 'Date',
                    fieldname: 'data_nascimento',
                    label: 'Data de Nascimento'
                },
                {
                    fieldtype: 'Select',
                    fieldname: 'tipo_pessoa',
                    label: 'Tipo de pessoa',
                    options: 'Física\nJurídica'
                },
                {
                    fieldtype: 'Data',
                    fieldname: 'cnpj',
                    label: 'CNPJ',
                    length: 18,
                    depends_on: 'eval:doc.tipo_pessoa=="Jurídica"',
                },
                {
                    fieldtype: 'Data',
                    fieldname: 'rg',
                    label: 'RG',
                    length: 12,
                    depends_on: 'eval:doc.tipo_pessoa=="Física"',
                },
                {
                    fieldtype: 'Data',
                    fieldname: 'cpf',
                    label: 'CPF',
                    length: 14,
                    depends_on: 'eval:doc.tipo_pessoa=="Física"',
                },
            ],
            primary_action_label: 'Salvar',
            primary_action: (values) => {
                frappe.call({
                    method: "treino.treino.doctype.compra.compra.criar_comprador",
                    args: {
                        values: values
                    },
                    callback(r) {
                        const response = r.message;
                        frappe.toast(`Cliente "${response.nome}" foi criado com sucesso!`);
                        frm.doc.cliente = response.name;
                        frm.refresh_field('cliente');
                        frm.trigger('cliente');    
                    }
                });

                dialog.hide();
            }
        });

        dialog.show();

        dialog.fields_dict.cpf.$input.on("keyup", function () {
            const v = cleanInpt(this, 11)

            let formatted = v.replace(/(\d{3})(\d)/, "$1.$2");
            formatted = formatted.replace(/(\d{3})(\d)/, "$1.$2");
            formatted = formatted.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

            $(this).val(formatted);
        });

        dialog.fields_dict.rg.$input.on("input", function () {
            const v = cleanInpt(this, 9)

            let formatted = v;
            if (v.length > 2) formatted = v.replace(/(\d{2})(\d)/, "$1.$2");
            if (v.length > 5) formatted = formatted.replace(/(\d{3})(\d)/, "$1.$2");
            if (v.length > 8) formatted = formatted.replace(/(\d{3})(\d{1})$/, "$1-$2");

            $(this).val(formatted);
        });

        dialog.fields_dict.cnpj.$input.on("input", function () {
            const v = cleanInpt(this, 14)

            let formatted = v;
            if (v.length > 2) formatted = v.replace(/(\d{2})(\d)/, "$1.$2");
            if (v.length > 5) formatted = formatted.replace(/(\d{3})(\d)/, "$1.$2");
            if (v.length > 8) formatted = formatted.replace(/(\d{3})(\d)/, "$1/$2");
            if (v.length > 12) formatted = formatted.replace(/(\d{4})(\d{1,2})$/, "$1-$2");

            $(this).val(formatted);
        });
    }
});

frappe.ui.form.on("compra_itens", {
    async item(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        const estoque = await frappe.db.get_value('Item', linha.item, 'quantidade_em_estoque');
        if (linha.valor_unitario === 0 && estoque.message.quantidade_em_estoque <= 0) {
            frm.get_field('itens').grid.grid_rows_by_docname[cdn].remove();
            frm.refresh_field('itens');
            frappe.throw("Item não está disponível no estoque");
        }
    },

    valor_unitario(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        calculateValorTotal(linha);
    },

    quantidade(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        calculateValorTotal(linha);
    },

    valor_total(frm, cdt, cdn) {
        const linha = locals[cdt][cdn];
        const valor_unitario = linha.valor_total / linha.quantidade;
        linha.valor_unitario = valor_unitario;
    }
});

const calculateValorTotal = (linha) => {
    const valor_total = linha.valor_unitario * linha.quantidade;
    linha.valor_total = valor_total;
};

const feedItens = (itens) => {
    const itens_data = itens.map(i => ({
        item: i.item,
        valor_unitario: i.valor_unitario,
        quantidade: i.quantidade,
        valor_total: i.valor_total
    }));
    return itens_data;
};

const cleanInpt = (input, size) => {
    const v = $(input).val().replace(/\D/g, "");
    if (v.length > size) v = v.substring(0, size);
    return v;
}
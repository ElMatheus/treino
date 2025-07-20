// Copyright (c) 2025, Adolfo and contributors
// For license information, please see license.txt

frappe.ui.form.on("Compra", {
    onload(frm) {
        window.compareGet = async (frm) => {
            let startTime = performance.now();
            const dbDoc = await frappe.db.get_doc(frm.doctype, frm.docname);
            let endTime = performance.now();
            let duration = endTime - startTime;
            console.log(`db.get_doc: ${duration} ms`);

            startTime = performance.now();
            const doc = await frappe.get_doc(frm.doctype, frm.docname);
            endTime = performance.now();
            duration = endTime - startTime;
            console.log(`get_doc: ${duration} ms`);

            startTime = performance.now();
            const dbGetValues = await frappe.db.get_value(
                frm.doctype,
                frm.docname,
                ["valor_total", "data_da_compra", "total_de_itens"],
            )
            endTime = performance.now();
            duration = endTime - startTime;
            console.log(`db.get_value: ${duration} ms`);

            startTime = performance.now();
            const getValues = await frappe.model.get_value(
                frm.doctype,
                frm.docname,
                ["valor_total", "data_da_compra", "total_de_itens"],
            )
            endTime = performance.now();
            duration = endTime - startTime;
            console.log(`get_value: ${duration} ms`);
        }
    },
	refresh(frm) {
        frappe.toast('Atualizando...');
	},

    validate(frm) {
        if (frm.doc.itens) {
            checkInventoryAvailability(frm);
        }
    },
    itens_add(frm, cdt, cdn) {
        frappe.msgprint('Item adicionado com sucesso!');
    },
});

frappe.ui.form.on("compra_itens", {
    itens_add(frm, cdt, cdn) {
        frm.trigger("valor_total");
    },

    itens_remove(frm, cdt, cdn) {
        frm.trigger("valor_total");
    },

    itens_move(frm, cdt, cdn) {
        console.log(`Item ${locals[cdt][cdn].descricao} moveu`)
    },

    item(frm, cdt, cdn) {
        let item = locals[cdt][cdn];

        if (item.item) {
            const itemDoc = frappe.get_doc("Item", item.item);
            if (itemDoc) {
                item.descricao = itemDoc.descricao;
                item.valor_unitario = itemDoc.preco_padrao || 0;
                item.quantidade = 1;

                item.valor_total = item.quantidade * item.valor_unitario;
                updateValorTotal(frm);
            }
        }
    },

    quantidade(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        if (item.quantidade < 0) {
            frappe.msgprint(__("Quantidade não pode ser negativa"));
            item.quantidade = 0;
        }

        if (item.valor_unitario) {
            item.valor_total = item.quantidade * item.valor_unitario;
            
        }
        updateValorTotal(frm);
    },

    valor_unitario(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        if (item.valor_unitario < 0) {
            frappe.msgprint(__("Valor unitário não pode ser negativo"));
            item.valor_unitario = 0;
        }
        if (item.quantidade) {
            item.valor_total = item.quantidade * item.valor_unitario;
        }
        updateValorTotal(frm);
    },

    valor_total(frm, cdt, cdn) {
        let item = locals[cdt][cdn];
        if (item.valor_total < 0) {
            frappe.msgprint(__("Valor total não pode ser negativo"));
            item.valor_total = 0;
        }
        if (item.quantidade != 0) {
            item.valor_unitario = getValorUnitario(item);
        }

        updateValorTotal(frm);
    },

});

// frappe.ui.form.on("compra_itens", {
//     itens_add(frm, cdt, cdn) {
//         frm.trigger("valor_total");
//     },

//     itens_remove(frm, cdt, cdn) {
//         frm.trigger("valor_total");
//     },

//     itens_move(frm, cdt, cdn) {
//         console.log(`Item ${locals[cdt][cdn].descricao} moveu`)
//     },

//     item(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.valor_unitario && item.quantidade) {
//             item.valor_total = item.quantidade * item.valor_unitario;
//             updateValorTotal(frm);
//         }
//     },

//     quantidade(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.quantidade < 0) {
//             frappe.msgprint(__("Quantidade não pode ser negativa"));
//             item.quantidade = 0;
//         }

//         if (item.valor_unitario) {
//             item.valor_total = item.quantidade * item.valor_unitario;
            
//         }
//         updateValorTotal(frm);
//     },

//     valor_unitario(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.valor_unitario < 0) {
//             frappe.msgprint(__("Valor unitário não pode ser negativo"));
//             item.valor_unitario = 0;
//         }
//         if (item.quantidade) {
//             item.valor_total = item.quantidade * item.valor_unitario;
//         }
//         updateValorTotal(frm);
//     },

//     valor_total(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.valor_total < 0) {
//             frappe.msgprint(__("Valor total não pode ser negativo"));
//             item.valor_total = 0;
//         }
//         if (item.quantidade != 0) {
//             item.valor_unitario = getValorUnitario(item);
//         }

//         updateValorTotal(frm);
//     },

// });

// frappe.ui.form.on("compra_itens", {
//     itens_add(frm, cdt, cdn) {
//         frm.trigger("valor_total");
//     },

//     itens_remove(frm, cdt, cdn) {
//         frm.trigger("valor_total");
//     },

//     itens_move(frm, cdt, cdn) {
//         console.log(`Item ${locals[cdt][cdn].descricao} moveu`)
//     },

//     item(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.valor_unitario && item.quantidade) {
//             item.valor_total = item.quantidade * item.valor_unitario;
//             updateValorTotal(frm);
//         }
//     },

//     quantidade(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.quantidade < 0) {
//             frappe.msgprint(__("Quantidade não pode ser negativa"));
//             item.quantidade = 0;
//         }

//         if (item.valor_unitario) {
//             item.valor_total = item.quantidade * item.valor_unitario;
            
//         }
//         updateValorTotal(frm);
//     },

//     valor_unitario(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.valor_unitario < 0) {
//             frappe.msgprint(__("Valor unitário não pode ser negativo"));
//             item.valor_unitario = 0;
//         }
//         if (item.quantidade) {
//             item.valor_total = item.quantidade * item.valor_unitario;
//         }
//         updateValorTotal(frm);
//     },

//     valor_total(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         if (item.valor_total < 0) {
//             frappe.msgprint(__("Valor total não pode ser negativo"));
//             item.valor_total = 0;
//         }
//         if (item.quantidade != 0) {
//             item.valor_unitario = getValorUnitario(item);
//         }

//         updateValorTotal(frm);
//     },

// });


// frappe.ui.form.on("compra_itens", {
//     itens_add(frm, cdt, cdn) {
//         updateValorTotal(frm);
//     },

//     itens_remove(frm, cdt, cdn) {
//         updateValorTotal(frm);
//     },

//     itens_move(frm, cdt, cdn) {
//         console.log(`Item ${locals[cdt][cdn].descricao} moveu`)
//     },

//     item(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         calculateItemTotal(frm, item);
//     },

//     quantidade(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         calculateQuantidade(frm, item);
//     },

//     valor_unitario(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         calculateItemUnitario(frm, item);
//     },

//     valor_total(frm, cdt, cdn) {
//         let item = locals[cdt][cdn];
//         calculateItemFromTotal(frm, item);
//     },

// });

const calculateItemFromTotal = (frm, item) => {
    if (item.valor_total < 0) {
        frappe.msgprint(__("Valor total não pode ser negativo"));
        item.valor_total = 0;
    }
    if (item.quantidade != 0) {
        item.valor_unitario = getValorUnitario(item);
    }

    updateValorTotal(frm);
}

const calculateItemUnitario = (frm, item) => {
    if (item.valor_unitario < 0) {
        frappe.msgprint(__("Valor unitário não pode ser negativo"));
        item.valor_unitario = 0;
    }
    if (item.quantidade) {
        item.valor_total = item.valor_total / item.quantidade;
    }
    updateValorTotal(frm);
}

const calculateItemTotal = (frm, item) => {
    if (item.valor_unitario && item.quantidade) {
        item.valor_total = item.valor_total / item.quantidade;
        updateValorTotal(frm);
    }
}

const calculateQuantidade = (frm, item) => {
    if (item.quantidade < 0) {
        frappe.msgprint(__("Quantidade não pode ser negativa"));
        item.quantidade = 0;
    }

    if (item.valor_unitario) {
        item.valor_total = item.valor_total / item.quantidade;
        
    }
    updateValorTotal(frm);
}

const updateValorTotal = (frm) => {
    let valor_total = 0;
    let total_de_itens = 0;
    if (frm.doc.itens) {
        frm.doc.itens.forEach(item => {
            if (item.valor_total) {
                valor_total += item.valor_total;
            }
            if (item.quantidade) {
                total_de_itens += item.quantidade;
            }
        });
    } else {
        valor_total = 0;
        total_de_itens = 0;
    }

    frm.set_value("valor_total", valor_total);
    frm.set_value("total_de_itens", total_de_itens);
}

const getTotalItem = (item) => {
    if (item.valor_unitario && item.quantidade) {
        return item.quantidade * item.valor_unitario;
    }
    return 0;
}

const getValorUnitario = (item) => {
    if (item.valor_total && item.quantidade) {
        return item.valor_total / item.quantidade;
    }
    return 0;
}

const checkInventoryAvailability = async (itens) => {
    const response = await frappe.call({
        method: "treino.treino.doctype.compra.compra.check_inventory_availability",
        args: {
            itens: itens.doc.itens
        },
        freeze: true,
        freeze_message: ("Verificando disponibilidade de estoque...")
    });

    return response.message;
}
// Copyright (c) 2025, Adolfo and contributors
// For license information, please see license.txt

frappe.ui.form.on("Nota Fiscal", {
  async onload(frm) {
    frappe.realtime.on("nova_nota_fiscal_emitida", async (data) => {
      await frappe.db.set_value('Nota Fiscal', data.nota, 'status', data.status);
      frm.refresh_field('status');
      frappe.show_alert({
        message: `A compra ${data.compra} da Nota Fiscal ${data.nota} agora está com o status "${data.status}".`,
        indicator: 'green'
      }, 7);
    });
  },

  refresh(frm) {
    if (frm.doc.name && frm.doc.status !== 'Emitido') {
      frm.add_custom_button("Emitir Nota", function () {
        frappe.confirm('Tem certeza que deseja emitir essa nota?', () => {
          frappe.call({
            method: "treino.treino.doctype.nota_fiscal.nota_fiscal.emitir_nota",
            args: {
              user: frm.doc.owner,
              compra: frm.doc.compra,
              nf: frm.doc.name
            },
            callback(r) {
            }
          });
        });
      }).addClass("btn-primary");
    }
  },
})
# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class NotaFiscal(Document):
    def after_insert(self):
        valor_total = sum(p.valor_total for p in self.itens)
        itens_total = sum(p.quantidade for p in self.itens)
        self.valor_total = valor_total
        self.total_itens = itens_total
        self.save()

@frappe.whitelist()
def emitir_nota(nf):
    nfDb = frappe.get_value("Nota Fiscal", nf, ["compra", "owner"])
    frappe.publish_realtime(
        event="nova_nota_fiscal_emitida",
        message={"nota": nf, "compra": nfDb[0], "status": "Emitido"},
        user=nfDb[1]
    )


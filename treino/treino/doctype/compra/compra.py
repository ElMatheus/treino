# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Compra(Document):
   def validate(self):
       check_inventory_availability(self.itens)
       
   def on_submit(self):
        # Lógica para executar quando o documento for submetido
        frappe.msgprint("Compra submetida com sucesso!")
        for item in self.itens:
            try:
                item_doc = frappe.get_doc('Item', item.get('item'))
                item_doc.update_inventory(item.get('quantidade'))
            except Exception as e:
                frappe.throw(f"Erro ao atualizar o estoque do item {item.get('item')}: {str(e)}")


@frappe.whitelist()
def check_inventory_availability(itens):
    if isinstance(itens, str):
        itens = frappe.parse_json(itens)
    if not isinstance(itens, list):
        frappe.throw("Itens deve ser uma lista.")

    for item in itens:
        quantidade_em_estoque = frappe.db.get_value('Item', item.get('item'), 'quantidade_em_estoque')
        if item.get('quantidade') > quantidade_em_estoque:
            frappe.throw(f"Estoque insuficiente para o item {item.get('item')}. Disponível: {quantidade_em_estoque}, Necessário: {item.get('quantidade')}.")

    return True
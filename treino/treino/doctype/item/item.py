# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document


class Item(Document):
	def update_inventory(self, quantidade):
		self.quantidade_em_estoque -= quantidade
		self.save(ignore_permissions=True)


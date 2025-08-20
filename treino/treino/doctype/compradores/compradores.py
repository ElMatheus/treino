# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document
from frappe.utils.data import getdate, today

class Compradores(Document):
  @property
  def idade(self):
    if self.data_nascimento:
      nascimento = getdate(self.data_nascimento)
      hoje = getdate(today())
      
      idade = hoje.year - nascimento.year - ((hoje.month, hoje.day) < (nascimento.month, nascimento.day))
      return idade
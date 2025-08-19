# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt

import frappe
import requests
from frappe.model.document import Document


class Fornecedor(Document):
    def before_save(self):
        for item in self.itens:
            preco = float(item.preco_fornecedor or 0)
            desconto = float(item.desconto or 0)
            item.valor_total = preco - (preco * (desconto / 100))

@frappe.whitelist()
def buscar_cnpj(cnpj):
	url = f"https://open.cnpja.com/office/{cnpj}"
	resp = requests.get(url)
	if resp.status_code == 400:
		frappe.toast("Não foi possível encontrar os dados para o CNPJ informado.")
		return None
	return resp.json()

@frappe.whitelist()
def buscar_cep(cep):
	url = f"https://viacep.com.br/ws/{cep}/json/"
	resp = requests.get(url)
	return resp.json()
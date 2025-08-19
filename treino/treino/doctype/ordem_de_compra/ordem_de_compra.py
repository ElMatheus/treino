# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class OrdemdeCompra(Document):
  def before_save(self):
    valor_total = sum(p.valor_total for p in self.itens_fornecedor)
    itens_total = sum(p.quantidade for p in self.itens_fornecedor)
    self.valor_total_oc = valor_total
    self.total_itens_oc = itens_total
  def on_submit(self):
    controleEstoque(self.itens_fornecedor, True)    
  def on_cancel(self):
    controleEstoque(self.itens_fornecedor, False)    
    
def controleEstoque(itens, metodo):
    for item in itens:
        doc = frappe.get_value('Item', item.item, ['quantidade_em_estoque', 'descricao', 'valor'], as_dict=True)
        if metodo:
            nova_quantidade = doc['quantidade_em_estoque'] + item.quantidade
            novo_valor = item.preco_sugerido
        else:
            nova_quantidade = doc['quantidade_em_estoque'] - item.quantidade
            novo_valor = doc['valor'] 
        frappe.set_value('Item', item.item, {
            'quantidade_em_estoque': nova_quantidade,
            'valor': novo_valor
        })
        frappe.msgprint(f"Estoque do item {doc['descricao']} atualizado com sucesso.")
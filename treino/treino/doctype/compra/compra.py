# Copyright (c) 2025, Adolfo and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import now

class Compra(Document):
  def before_save(self):
    valor_total = sum(p.valor_total for p in self.itens)
    itens_total = sum(p.quantidade for p in self.itens)
    self.valor_total = valor_total
    self.total_de_itens = itens_total
  def on_submit(self):
      controleEstoque(self.itens, False)
      frappe.get_doc({
        "doctype": "Historico de Compra",
        'compra_ref': self.name,
        "compra_itens": self.itens
    }).insert()
  def on_cancel(self):
      controleEstoque(self.itens, True)
      
def controleEstoque(itens, metodo):
    for item in itens:
        doc = frappe.get_value('Item', item.item, ['quantidade_em_estoque', 'descricao'], as_dict=True)
        if metodo:
            nova_quantidade = doc['quantidade_em_estoque'] + item.quantidade
        else:
            if doc['quantidade_em_estoque'] < item.quantidade :
                frappe.throw(f"Não temos estoque suficiente para o produto {doc['descricao']}.")
            nova_quantidade = doc['quantidade_em_estoque'] - item.quantidade
        frappe.set_value('Item', item.item, {
            'quantidade_em_estoque': nova_quantidade
        })
        frappe.msgprint(f"Estoque do item {doc['descricao']} atualizado com sucesso.")
        
@frappe.whitelist()
def criar_nota_fiscal(itensParam, compra):
    itens = frappe.parse_json(itensParam)
    if not itens:
        frappe.toast("Por favor, selecione ao menos um item antes de criar a nota fiscal.")
        return None

    doc_nota = frappe.get_doc({
        'doctype': 'Nota Fiscal',   
        'data_nota': now(), 
        'compra': compra,          
        'itens': itens
    })
    doc_nota.insert()
    return doc_nota.name    

@frappe.whitelist()
def criar_comprador(values):
    data = now()
    doc = frappe.new_doc("Compradores")
    form = frappe.parse_json(values) 
    doc.nome = form.get('nome')
    doc.cliente_desde = data
    doc.email = form.get('email')
    doc.data_nascimento = form.get('data_nascimento')
    doc.tipo_pessoa = form.get('tipo_pessoa')
    doc.cnpj = form.get('cnpj')
    doc.rg = form.get('rg')
    doc.cpf = form.get('cpf')
    doc.save()
    return {
        'nome': doc.nome,
        'name': doc.name
    }
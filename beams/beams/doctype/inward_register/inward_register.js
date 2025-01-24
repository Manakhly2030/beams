// Copyright (c) 2025, efeone and contributors
// For license information, please see license.txt
frappe.ui.form.on('Inward Register', {
    refresh: function (frm) {
        if (frm.doc.docstatus === 1) {
            frm.add_custom_button(__('Outward Register'), function () {
                frappe.new_doc("Outward Register", {
                  inward_register: frm.doc.name,
                });
            }, __("Create"));

            frm.add_custom_button(__(' Visitor Pass'), function () {
                frappe.new_doc("Visitor Pass", {
                    inward_register: frm.doc.name,
                    issued_date: frappe.datetime.now_date(),
                    issued_time: frappe.datetime.now_time(),
                    issued_to: frm.doc.visitor_name
                });
            }, __("Create"));
        }
    }
});

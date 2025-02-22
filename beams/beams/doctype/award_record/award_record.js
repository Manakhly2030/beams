// Copyright (c) 2025, efeone and contributors
// For license information, please see license.txt

frappe.ui.form.on('Award Record', {
    refresh: function (frm) {
        if (!frm.is_new() && frm.doc.total_amount > 0) {
            frm.add_custom_button(__('Create Journal Voucher'), function () {
                create_jv(frm);
            }, __('Actions'));
        }
    }
});

function create_jv(frm) {
    // Fetch Default Award Expense Account from BEAMS Admin Settings
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'BEAMS Admin Settings'
        },
        callback: function (r) {
            if (r.message && r.message.default_award_expense_account) {
                const default_account = r.message.default_award_expense_account;

                // Create a new Journal Entry
                frappe.new_doc('Journal Entry', {
                    voucher_type: 'Journal Entry',
                    accounts: [
                        {
                            account: default_account,
                            debit_in_account_currency: frm.doc.total_amount
                        }
                    ],
                    user_remark: `Award Record: ${frm.doc.name}`
                });
            } else {
                frappe.msgprint(__('Please set the Default Award Expense Account in BEAMS Admin Settings.'));
            }
        }
    });
}

frappe.ui.form.on("Award Expense Detail", {
    amount: function (frm) {
        frm.call("update_total_amount");
    }
});

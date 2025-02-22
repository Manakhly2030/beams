frappe.ui.form.on('Project', {
    refresh(frm) {
      //function adds a button to the 'Project' form to create an Adhoc Budget.
        frm.add_custom_button(__('Adhoc Budget'), function () {
            frappe.model.open_mapped_doc({
                method: "beams.beams.custom_scripts.project.project.create_adhoc_budget",
                frm: frm,
            });
        }, __("Create"));

        // Add a button to create an Equipment Hire Request
        frm.add_custom_button(__('Equipment Hire Request'), function () {
            frappe.model.open_mapped_doc({
                method: "beams.beams.custom_scripts.project.project.map_equipment_hire_request",
                frm: frm,
            });
        }, __("Create"));

        // Add a button to create an Equipment Request
        frm.add_custom_button(__('Equipment Request'), function () {
            frappe.model.open_mapped_doc({
                method: "beams.beams.custom_scripts.project.project.map_equipment_request",
                frm: frm,
            });
        }, __("Create"));

        // Adds a button to the 'Project' form to create an Transportation Request.
        frm.add_custom_button(__('Transportation Request'), function () {
            frappe.model.open_mapped_doc({
                method: "beams.beams.custom_scripts.project.project.create_transportation_request",
                frm: frm,
            });
        }, __("Create"));

        frm.add_custom_button(__('Assign Equipments'), function () {
            const dialog = new frappe.ui.Dialog({
                title: 'Assign Equipments',
                fields: [
                    {
                        label: 'Required From',
                        fieldtype: 'Datetime',
                        fieldname: 'required_from',
                        in_list_view: 1,
                        reqd: 1
                    },
                    {
                        label: 'Required To',
                        fieldtype: 'Datetime',
                        fieldname: 'required_to',
                        in_list_view: 1,
                        reqd: 1
                    },
                    {
                        fieldtype: 'Table',
                        label: 'Equipments',
                        fieldname: 'equipments',
                        reqd: 1,
                        fields: [
                            {
                                label: 'Item',
                                fieldtype: 'Link',
                                fieldname: 'item',
                                options: 'Item',
                                in_list_view: 1,
                                reqd: 1,
                                onchange: function() {
                                  let data = [];
                                  let promises = [];

                                  dialog.fields_dict.equipments.df.data.forEach((item, i) => {
                                      let promise = frappe.call({
                                          method: "beams.beams.custom_scripts.project.project.get_available_quantities",
                                          args: {
                                              items: [item.item],
                                              bureau: frm.doc.bureau
                                          },
                                          callback: function(r) {
                                              if (r.message) {
                                                  const available_qty = r.message[item.item] || 0;
                                                  item["available_quantity"] = available_qty;
                                                  data.push(item);
                                              }
                                          }
                                      });

                                      promises.push(promise);
                                  });

                                  Promise.all(promises).then(() => {
                                      dialog.fields_dict.equipments.df.data = data;
                                      dialog.fields_dict.equipments.grid.refresh();
                                  });
                              }
                            },
                            {
                                label: 'Available Quantity',
                                fieldtype: 'Int',
                                fieldname: 'available_quantity',
                                in_list_view: 1,
                                read_only: 1,
                                default: 0
                            },
                            {
                                label: 'Required Quantity',
                                fieldtype: 'Int',
                                fieldname: 'required_quantity',
                                in_list_view: 1,
                                reqd: 1
                            },
                        ]
                    }
                ],
                size: 'large',
                primary_action_label: 'Submit',
                primary_action(values) {
                    const equipment_data = values?.equipments || [];

                    if (!equipment_data.length) {
                        frappe.msgprint(__('Please add at least one equipment row.'));
                        return;
                    }

                    const request_data = [];
                    const hire_request_data = [];

                    for (const row of equipment_data) {
                        const available_qty = row.available_quantity || 0;

                        if (row.required_quantity <= available_qty) {
                            request_data.push({
                                item: row.item,
                                quantity: row.required_quantity,
                                available_quantity: available_qty,
                                required_from: row.required_from,
                                required_to: row.required_to
                            });
                        } else {
                            if (available_qty > 0) {
                              request_data.push({
                                  item: row.item,
                                  quantity: available_qty,
                                  available_quantity: available_qty,
                                  required_from: row.required_from,
                                  required_to: row.required_to
                              });
                            }

                            hire_request_data.push({
                                item: row.item,
                                required_quantity: row.required_quantity - available_qty,
                            });
                        }
                    }

                    const create_requests = [];

                    if (request_data.length) {
                        create_requests.push(
                            frappe.call({
                                method: 'beams.beams.custom_scripts.project.project.create_equipment_request',
                                args: {
                                    source_name: frm.doc.name,
                                    equipment_data: JSON.stringify(request_data),
                                    required_from: values.required_from,
                                    required_to: values.required_to
                                }
                            })
                        );
                    }

                    if (hire_request_data.length) {
                        create_requests.push(
                            frappe.call({
                                method: 'beams.beams.custom_scripts.project.project.create_equipment_hire_request',
                                args: {
                                    source_name: frm.doc.name,
                                    equipment_data: JSON.stringify(hire_request_data),
                                    required_from: values.required_from,
                                    required_to: values.required_to
                                }
                            })
                        );
                    }

                    Promise.all(create_requests)
                        .then(() => {
                            dialog.hide();
                            frm.reload_doc();
                        });
                }
            });

            // Set the item filter based on bureau's assets
            frappe.call({
                method: "beams.beams.custom_scripts.project.project.get_assets_by_bureau",
                args: { bureau: frm.doc.bureau },
                callback: function(r) {
                    if (r.message?.length) {
                        dialog.fields_dict.equipments.grid.get_field("item").get_query = () => ({
                            filters: { name: ["in", r.message] }
                        });
                        dialog.show();
                    } else {
                        frappe.msgprint(__('No available items found for the selected Bureau.'));
                    }
                }
            });
        });

      // Add "Technical Request" button under the "Create" group
      frm.add_custom_button(__('Technical Request'), function () {
          // Open a dialog with the specified fields
          let dialog = new frappe.ui.Dialog({
              title: 'Technical Request',
              fields: [
                  {
                      fieldtype: 'Table',
                      label: 'Requirements',
                      fieldname: 'requirements',
                      reqd: 1,
                      fields: [
                          {
                              label: 'Department',
                              fieldtype: 'Link',
                              fieldname: 'department',
                              options: 'Department',
                              in_list_view: 1,
                              reqd: 1
                          },
                          {
                              label: 'Designation',
                              fieldtype: 'Link',
                              fieldname: 'designation',
                              options: 'Designation',
                              in_list_view: 1,
                              reqd: 1
                          },
                          {
                              label: 'Required From',
                              fieldtype: 'Datetime',
                              fieldname: 'required_from',
                              in_list_view: 1,
                              reqd: 1
                          },
                          {
                              label: 'Required To',
                              fieldtype: 'Datetime',
                              fieldname: 'required_to',
                              in_list_view: 1,
                              reqd: 1
                          },
                          {
                              label: 'Remarks',
                              fieldtype: 'Small Text',
                              fieldname: 'remarks',
                              in_list_view: 1
                          }
                      ]
                  }
              ],
              size: 'large',
              primary_action_label: 'Submit',
              primary_action: function () {
                  let values = dialog.get_values();
                  if (values && values.requirements) {
                      // Perform validation for each row
                      for (let i = 0; i < values.requirements.length; i++) {
                          let row = values.requirements[i];

                          if (!row.required_from || !row.required_to) {
                              frappe.msgprint({
                                  title: __('Validation Error'),
                                  message: __('Please fill both "Required From" and "Required To" in #row  {0}.', [i + 1]),
                                  indicator: 'red'
                              });
                              return;
                          }

                          // Ensure Required To is later than Required From
                          if (row.required_to <= row.required_from) {
                              frappe.msgprint({
                                  title: __('Validation Error'),
                                  message: __('"Required To" must be later than "Required From" in # row {0}.', [i + 1]),
                                  indicator: 'red'
                              });
                              return;
                          }
                      }

                      frappe.call({
                          method: 'beams.beams.custom_scripts.project.project.create_technical_support_request',
                          args: {
                              project_id: frm.doc.name,
                              requirements: JSON.stringify(values.requirements)
                          },
                      });
                      dialog.hide();
                  }
              }
          });
          dialog.show();
        }, __("Create"));

        frm.add_custom_button("External Resource Request", function() {
            frappe.new_doc("External Resource Request", {
                project: frm.doc.name,
                bureau: frm.doc.bureau
            });
        }, "Create");

     }
  });

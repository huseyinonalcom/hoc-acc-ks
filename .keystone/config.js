"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// keystone.ts
var keystone_exports = {};
__export(keystone_exports, {
  default: () => keystone_default
});
module.exports = __toCommonJS(keystone_exports);

// auth.ts
var import_crypto = require("crypto");
var import_auth = require("@keystone-6/auth");
var import_session = require("@keystone-6/core/session");
var sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV !== "production") {
  sessionSecret = (0, import_crypto.randomBytes)(32).toString("hex");
}
var { withAuth } = (0, import_auth.createAuth)({
  listKey: "User",
  identityField: "username",
  sessionData: "id username role permissions isBlocked",
  secretField: "password",
  initFirstItem: {
    fields: ["username", "name", "role", "email", "password"]
  }
});
var sessionMaxAge = 60 * 60 * 24 * 30;
var session = (0, import_session.statelessSessions)({
  maxAge: sessionMaxAge,
  secret: sessionSecret
});

// keystone.ts
var import_core2 = require("@keystone-6/core");

// schema.ts
var import_fields = require("@keystone-6/core/fields");
var import_access = require("@keystone-6/core/access");
var import_core = require("@keystone-6/core");
function isAdmin({ session: session2 }) {
  if (!session2) return false;
  if (session2.data.role == "admin") return true;
  return !session2.data.isBlocked;
}
function isManager({ session: session2 }) {
  if (!session2) return false;
  if (session2.data.role == "admin" || session2.data.role == "manager") return true;
  return !session2.data.isBlocked;
}
function isEmployee({ session: session2 }) {
  if (!session2) return false;
  if (session2.data.role == "employee" || session2.data.role == "admin" || session2.data.role == "manager") return true;
  return !session2.data.isBlocked;
}
function isUser({ session: session2 }) {
  if (!session2) return false;
  if (session2.data.role == "employee" || session2.data.role == "admin" || session2.data.role == "manager" || session2.data.role == "customer") return true;
  return !session2.data.isBlocked;
}
var lists = {
  WorkOrder: (0, import_core.list)({
    ui: {
      labelField: "number"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isManager
      }
    },
    fields: {
      number: (0, import_fields.text)({ validation: { isRequired: true } }),
      materials: (0, import_fields.relationship)({
        ref: "Material.workOrders",
        many: true
      }),
      operations: (0, import_fields.relationship)({
        ref: "WorkOrderOperation.workOrder",
        many: true
      }),
      datePlanned: (0, import_fields.timestamp)(),
      dateStarted: (0, import_fields.timestamp)(),
      dateFinished: (0, import_fields.timestamp)(),
      creator: (0, import_fields.relationship)({
        ref: "User.workOrders",
        many: false
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  WorkOrderOperation: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context }) => {
        if (operation === "update") {
          if (inputData.startedAt) {
            if (item.finishedAt) {
              throw new Error("Application already finished");
            }
          }
          if (inputData.finishedAt) {
            if (!item.startedAt) {
              throw new Error("Application not started");
            }
            if (item.finishedAt) {
              throw new Error("Application already finished");
            }
            if (inputData.finishedAt < item.startedAt) {
              throw new Error("Finish date cannot be before start date");
            }
          }
        }
      }
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isEmployee
      }
    },
    fields: {
      files: (0, import_fields.relationship)({
        ref: "File",
        many: true
      }),
      startedAt: (0, import_fields.timestamp)(),
      finishedAt: (0, import_fields.timestamp)(),
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      description: (0, import_fields.text)(),
      value: (0, import_fields.float)({ validation: { isRequired: true, min: 0 } }),
      price: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Float,
          async resolve(item, args, context) {
            try {
              const workOrder = await context.query.WorkOrder.findOne({
                where: { id: item.workOrderId },
                query: "reduction"
              });
              let total = item.value;
              total -= total * (workOrder.reduction ?? 0) / 100;
              return total;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      reduction: (0, import_fields.float)({ defaultValue: 0 }),
      amount: (0, import_fields.float)({ validation: { isRequired: true, min: 0 } }),
      total: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Float,
          async resolve(item, args, context) {
            try {
              const workOrder = await context.query.WorkOrder.findOne({
                where: { id: item.workOrderId },
                query: "reduction"
              });
              let total = item.value * item.amount - item.value * item.amount * (item.reduction ?? 0) / 100;
              total -= total * (workOrder.reduction ?? 0) / 100;
              return total;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      wastage: (0, import_fields.float)({
        validation: { min: 0 },
        defaultValue: 0
      }),
      workOrder: (0, import_fields.relationship)({
        ref: "WorkOrder.operations",
        many: false
      }),
      operation: (0, import_fields.relationship)({
        ref: "Operation.workOrderOperations",
        many: false
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Operation: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isEmployee
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      files: (0, import_fields.relationship)({
        ref: "File",
        many: true
      }),
      material: (0, import_fields.relationship)({
        ref: "Material.operations",
        many: false
      }),
      workOrderOperations: (0, import_fields.relationship)({
        ref: "WorkOrderOperation.operation",
        many: true
      }),
      user: (0, import_fields.relationship)({ ref: "User.operations", many: false }),
      cost: (0, import_fields.float)(),
      value: (0, import_fields.float)({ validation: { isRequired: true, min: 0 } }),
      duration: (0, import_fields.integer)(),
      description: (0, import_fields.text)(),
      extraFields: (0, import_fields.json)()
    }
  }),
  Address: (0, import_core.list)({
    ui: {
      labelField: "street"
    },
    access: {
      operation: {
        create: isUser,
        query: isUser,
        update: isEmployee,
        delete: isAdmin
      }
    },
    fields: {
      street: (0, import_fields.text)({ validation: { isRequired: true } }),
      door: (0, import_fields.text)({ validation: { isRequired: true } }),
      zip: (0, import_fields.text)({ validation: { isRequired: true } }),
      city: (0, import_fields.text)({ validation: { isRequired: true } }),
      floor: (0, import_fields.text)({ validation: { isRequired: true } }),
      province: (0, import_fields.text)({ validation: { isRequired: true } }),
      country: (0, import_fields.text)({ validation: { isRequired: true } }),
      customer: (0, import_fields.relationship)({
        ref: "User.customerAddresses",
        many: false
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Payment: (0, import_core.list)({
    ui: {
      labelField: "timestamp"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isManager,
        delete: isAdmin
      }
    },
    fields: {
      value: (0, import_fields.float)({ validation: { isRequired: true, min: 0.1 } }),
      document: (0, import_fields.relationship)({
        ref: "Document.payments",
        many: true
      }),
      out: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Boolean,
          async resolve(item, args, context) {
            try {
              const document = await context.query.Document.findMany({
                where: {
                  payments: {
                    some: {
                      id: {
                        equals: item.id
                      }
                    }
                  }
                },
                query: "type"
              });
              switch (document[0].type) {
                case "sat\u0131\u015F":
                  return false;
                case "irsaliye":
                  return false;
                case "fatura":
                  return false;
                case "bor\xE7 dekontu":
                  return false;
                case "alacak dekontu":
                  return true;
                case "sat\u0131n alma":
                  return true;
                default:
                  return false;
              }
            } catch (e) {
              return false;
            }
          }
        })
      }),
      isDeleted: (0, import_fields.checkbox)({ defaultValue: false }),
      creator: (0, import_fields.relationship)({
        ref: "User.payments",
        many: false
      }),
      reference: (0, import_fields.text)(),
      type: (0, import_fields.select)({
        type: "string",
        options: ["cash", "debit_card", "credit_card", "online", "bank_transfer", "financing", "financing_unverified", "promissory"],
        defaultValue: "cash",
        validation: { isRequired: true }
      }),
      timestamp: (0, import_fields.timestamp)({
        defaultValue: { kind: "now" },
        isOrderable: true
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  User: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        query: isUser,
        create: isManager,
        update: isManager,
        delete: isAdmin
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      username: (0, import_fields.text)({ validation: { isRequired: true }, isIndexed: "unique" }),
      email: (0, import_fields.text)({
        isIndexed: "unique"
      }),
      isBlocked: (0, import_fields.checkbox)({ defaultValue: false }),
      phone: (0, import_fields.text)(),
      role: (0, import_fields.select)({
        type: "string",
        options: ["admin", "customer", "employee", "manager"],
        defaultValue: "customer",
        validation: { isRequired: true },
        isIndexed: true,
        access: {
          update: isAdmin
        }
      }),
      permissions: (0, import_fields.multiselect)({
        type: "enum",
        options: [
          { label: "Warranty", value: "warranty" },
          { label: "Price", value: "price" }
        ],
        access: {
          update: isAdmin
        }
      }),
      ssid: (0, import_fields.text)(),
      password: (0, import_fields.password)({
        validation: {
          isRequired: true,
          length: {
            min: 6
          }
        }
      }),
      operations: (0, import_fields.relationship)({ ref: "Operation.user", many: true }),
      notes: (0, import_fields.relationship)({ ref: "Note.creator", many: true }),
      documents: (0, import_fields.relationship)({ ref: "Document.creator", many: true }),
      customerDocuments: (0, import_fields.relationship)({ ref: "Document.customer", many: true }),
      customerMovements: (0, import_fields.relationship)({
        ref: "StockMovement.customer",
        many: true
      }),
      stockMovements: (0, import_fields.relationship)({ ref: "StockMovement.creator", many: true }),
      customerCompany: (0, import_fields.text)(),
      customerTaxNumber: (0, import_fields.text)(),
      customerTaxCenter: (0, import_fields.text)(),
      payments: (0, import_fields.relationship)({ ref: "Payment.creator", many: true }),
      customerAddresses: (0, import_fields.relationship)({ ref: "Address.customer", many: true }),
      workOrders: (0, import_fields.relationship)({ ref: "WorkOrder.creator", many: true }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Note: (0, import_core.list)({
    ui: {
      labelField: "note"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin
      }
    },
    fields: {
      note: (0, import_fields.text)({ validation: { isRequired: true } }),
      creator: (0, import_fields.relationship)({
        ref: "User.notes",
        many: false
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  File: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      url: (0, import_fields.text)(),
      extraFields: (0, import_fields.json)()
    }
  }),
  Document: (0, import_core.list)({
    ui: {
      labelField: "createdAt"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isManager,
        delete: isManager
      }
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, resolvedData, context }) => {
        if (operation === "delete") {
          const products = await context.query.DocumentProduct.findMany({
            where: { document: { id: { equals: item.id } } },
            query: "id"
          });
          products.forEach(async (dp) => {
            await context.query.DocumentProduct.deleteOne({
              where: { id: dp.id }
            });
          });
        }
        if (operation === "create") {
          const docs = await context.query.Document.findMany({
            orderBy: { number: "desc" },
            where: { type: { equals: resolvedData.type } },
            query: "id number"
          });
          const lastDocument = docs.at(0);
          if (lastDocument) {
            const lastNumber = lastDocument.number.split("-")[1];
            const lastYear = lastDocument.number.split("-")[0];
            if (lastYear == (/* @__PURE__ */ new Date()).getFullYear()) {
              resolvedData.number = `${lastYear}-${(parseInt(lastNumber) + 1).toFixed(0).padStart(8, "0")}`;
            } else {
              resolvedData.number = `${(/* @__PURE__ */ new Date()).getFullYear()}-${(parseInt(lastNumber) + 1).toFixed(0).padStart(8, "0")}`;
            }
          } else {
            resolvedData.number = `${(/* @__PURE__ */ new Date()).getFullYear()}-${1 .toFixed(0).padStart(8, "0")}`;
          }
        }
      }
    },
    fields: {
      createdAt: (0, import_fields.timestamp)({
        defaultValue: { kind: "now" },
        isOrderable: true,
        access: {
          create: import_access.denyAll,
          update: import_access.denyAll
        }
      }),
      total: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Float,
          async resolve(item, args, context) {
            try {
              const materials = await context.query.DocumentProduct.findMany({
                where: { document: { id: { equals: item.id } } },
                query: "total"
              });
              let total = 0;
              materials.forEach((docProd) => {
                total += docProd.total;
              });
              return total - total * (item.reduction ?? 0) / 100;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      totalWithTax: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Float,
          async resolve(item, args, context) {
            try {
              const materials = await context.query.DocumentProduct.findMany({
                where: { document: { id: { equals: item.id } } },
                query: "total tax"
              });
              let total = 0;
              materials.forEach((docProd) => {
                total += docProd.total * (1 + docProd.tax / 100);
              });
              return total - total * (item.reduction ?? 0) / 100;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      type: (0, import_fields.select)({
        type: "string",
        options: ["teklif", "sat\u0131\u015F", "irsaliye", "fatura", "bor\xE7 dekontu", "alacak dekontu", "sat\u0131n alma"],
        validation: { isRequired: true }
      }),
      creator: (0, import_fields.relationship)({
        ref: "User.documents",
        many: false,
        access: {
          update: import_access.denyAll
        }
      }),
      supplier: (0, import_fields.relationship)({
        ref: "Supplier.documents",
        many: false
      }),
      customer: (0, import_fields.relationship)({
        ref: "User.customerDocuments",
        many: false,
        access: {
          update: import_access.denyAll
        }
      }),
      reduction: (0, import_fields.float)({ defaultValue: 0 }),
      isDeleted: (0, import_fields.checkbox)({ defaultValue: false }),
      fromDocument: (0, import_fields.relationship)({
        ref: "Document.toDocument",
        many: false
      }),
      delAddress: (0, import_fields.relationship)({
        ref: "Address",
        many: false
      }),
      docAddress: (0, import_fields.relationship)({
        ref: "Address",
        many: false
      }),
      toDocument: (0, import_fields.relationship)({
        ref: "Document.fromDocument",
        many: false
      }),
      products: (0, import_fields.relationship)({
        ref: "DocumentProduct.document",
        many: true
      }),
      payments: (0, import_fields.relationship)({
        ref: "Payment.document",
        many: true
      }),
      number: (0, import_fields.text)({ validation: { isRequired: true } }),
      totalPaid: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Float,
          async resolve(item, args, context) {
            try {
              const payments = await context.query.Payment.findMany({
                where: { document: { some: { id: { equals: item.id } } }, isDeleted: { equals: false } },
                query: "value"
              });
              let total = 0;
              payments.forEach((payment) => {
                total += payment.value;
              });
              return total;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  DocumentProduct: (0, import_core.list)({
    ui: {
      labelField: "amount"
    },
    hooks: {
      beforeOperation: async ({ operation, item, inputData, context }) => {
        if (operation === "delete") {
          const movements = await context.query.StockMovement.findMany({
            where: { documentProduct: { id: { equals: item.id } } },
            query: "id"
          });
          movements.forEach(async (movement) => {
            await context.query.StockMovement.deleteOne({
              where: { id: movement.id }
            });
          });
        }
      },
      afterOperation: async ({ operation, item, context }) => {
      }
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isEmployee,
        delete: isManager
      }
    },
    fields: {
      amount: (0, import_fields.float)({ validation: { isRequired: true, min: 1 } }),
      stockMovements: (0, import_fields.relationship)({
        ref: "StockMovement.documentProduct",
        many: true
      }),
      product: (0, import_fields.relationship)({
        ref: "Material.documentProducts",
        many: false
      }),
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      tax: (0, import_fields.float)({ validation: { isRequired: true, min: 0 } }),
      price: (0, import_fields.float)({ validation: { isRequired: true, min: 0 } }),
      reduction: (0, import_fields.float)({ defaultValue: 0 }),
      total: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Float,
          async resolve(item, args, context) {
            try {
              const document = await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "reduction"
              });
              let total = item.price * item.amount - item.price * item.amount * (item.reduction ?? 0) / 100;
              total -= total * (document.reduction ?? 0) / 100;
              return total;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      totalTax: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Float,
          async resolve(item, args, context) {
            try {
              const document = await context.query.Document.findOne({
                where: { id: item.documentId },
                query: "tax"
              });
              let total = item.price * item.amount - item.price * item.amount * (item.reduction ?? 0) / 100;
              return total * document.tax;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      document: (0, import_fields.relationship)({
        ref: "Document.products",
        many: false
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  AssemblyComponent: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        create: isManager,
        query: isEmployee,
        update: isManager,
        delete: isManager
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      description: (0, import_fields.text)(),
      amount: (0, import_fields.integer)(),
      assembly: (0, import_fields.relationship)({
        ref: "Material.components",
        many: false
      }),
      material: (0, import_fields.relationship)({
        ref: "Material.assemblyComponents",
        many: false
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Material: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        create: isManager,
        query: isUser,
        update: isManager,
        delete: isManager
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      components: (0, import_fields.relationship)({
        ref: "AssemblyComponent.assembly",
        many: true
      }),
      assemblyComponents: (0, import_fields.relationship)({
        ref: "AssemblyComponent.material",
        many: true
      }),
      description: (0, import_fields.text)(),
      price: (0, import_fields.float)({ validation: { isRequired: true, min: 0 } }),
      currentStock: (0, import_fields.virtual)({
        field: import_core.graphql.field({
          type: import_core.graphql.Int,
          async resolve(item, args, context) {
            try {
              const movements = await context.query.StockMovement.findMany({
                where: {
                  material: { id: { equals: item.id } }
                },
                query: "amount movementType"
              });
              let stock = 0;
              movements.forEach((movement) => {
                if (movement.movementType == "giri\u015F") {
                  stock += movement.amount;
                } else {
                  stock -= movement.amount;
                }
              });
              return stock;
            } catch (e) {
              return 0;
            }
          }
        })
      }),
      status: (0, import_fields.select)({
        type: "string",
        options: ["aktif", "pasif", "iptal"],
        defaultValue: "aktif",
        validation: { isRequired: true }
      }),
      files: (0, import_fields.relationship)({
        ref: "File",
        many: true
      }),
      workOrders: (0, import_fields.relationship)({
        ref: "WorkOrder.materials",
        many: true
      }),
      code: (0, import_fields.text)(),
      ean: (0, import_fields.text)(),
      tax: (0, import_fields.float)({ defaultValue: 20, validation: { isRequired: true, min: 0 } }),
      brand: (0, import_fields.relationship)({
        ref: "Brand.materials",
        many: false
      }),
      suppliers: (0, import_fields.relationship)({
        ref: "Supplier.materials",
        many: true
      }),
      pricedBy: (0, import_fields.select)({
        type: "string",
        options: ["amount", "volume(m\xB3)", "length(mm)", "weight(g)", "area(m\xB2)"],
        defaultValue: "amount",
        validation: { isRequired: true }
      }),
      type: (0, import_fields.select)({
        type: "string",
        options: ["raw", "product"],
        defaultValue: "product",
        validation: { isRequired: true }
      }),
      operations: (0, import_fields.relationship)({
        ref: "Operation.material",
        many: true
      }),
      stockMovements: (0, import_fields.relationship)({
        ref: "StockMovement.material",
        many: true
      }),
      documentProducts: (0, import_fields.relationship)({
        ref: "DocumentProduct.product",
        many: true
      }),
      width: (0, import_fields.float)({ validation: { min: 1 } }),
      height: (0, import_fields.float)({ validation: { min: 1 } }),
      length: (0, import_fields.float)({ validation: { min: 1 } }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Storage: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        create: isAdmin,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      stockMovements: (0, import_fields.relationship)({
        ref: "StockMovement.storage",
        many: true
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  StockMovement: (0, import_core.list)({
    ui: {
      labelField: "movementType"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isEmployee,
        update: isAdmin,
        delete: isAdmin
      }
    },
    fields: {
      material: (0, import_fields.relationship)({
        ref: "Material.stockMovements",
        many: false
      }),
      storage: (0, import_fields.relationship)({
        ref: "Storage.stockMovements",
        many: false
      }),
      amount: (0, import_fields.float)({ validation: { isRequired: true, min: 0 } }),
      movementType: (0, import_fields.select)({
        type: "string",
        options: ["giri\u015F", "\xE7\u0131k\u0131\u015F"],
        defaultValue: "giri\u015F",
        validation: { isRequired: true }
      }),
      documentProduct: (0, import_fields.relationship)({
        ref: "DocumentProduct.stockMovements",
        many: false
      }),
      note: (0, import_fields.text)(),
      customer: (0, import_fields.relationship)({
        ref: "User.customerMovements",
        many: false
      }),
      date: (0, import_fields.timestamp)({
        defaultValue: { kind: "now" },
        isOrderable: true
      }),
      creator: (0, import_fields.relationship)({ ref: "User.stockMovements", many: false }),
      createdAt: (0, import_fields.timestamp)({
        defaultValue: { kind: "now" },
        isOrderable: true,
        access: {
          create: import_access.denyAll,
          update: import_access.denyAll
        }
      }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Supplier: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        create: isManager,
        query: isUser,
        update: isManager,
        delete: isAdmin
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      materials: (0, import_fields.relationship)({ ref: "Material.suppliers", many: true }),
      documents: (0, import_fields.relationship)({ ref: "Document.supplier", many: true }),
      address: (0, import_fields.text)(),
      iban: (0, import_fields.text)({ validation: { isRequired: false } }),
      taxId: (0, import_fields.text)({ validation: { isRequired: false } }),
      taxCenter: (0, import_fields.text)({ validation: { isRequired: false } }),
      email: (0, import_fields.text)({ validation: { isRequired: false } }),
      phone: (0, import_fields.text)({ validation: { isRequired: false } }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Brand: (0, import_core.list)({
    ui: {
      labelField: "name"
    },
    access: {
      operation: {
        create: isEmployee,
        query: isUser,
        update: isEmployee,
        delete: isAdmin
      }
    },
    fields: {
      name: (0, import_fields.text)({ validation: { isRequired: true } }),
      materials: (0, import_fields.relationship)({ ref: "Material.brand", many: true }),
      extraFields: (0, import_fields.json)()
    }
  }),
  Notification: (0, import_core.list)({
    ui: {
      labelField: "date"
    },
    access: {
      operation: {
        create: isAdmin,
        query: isUser,
        update: isAdmin,
        delete: isAdmin
      }
    },
    fields: {
      date: (0, import_fields.timestamp)({
        defaultValue: { kind: "now" },
        isOrderable: true
      }),
      message: (0, import_fields.text)({ validation: { isRequired: true } }),
      link: (0, import_fields.text)(),
      handled: (0, import_fields.checkbox)({ defaultValue: false }),
      notifyRoles: (0, import_fields.multiselect)({
        type: "enum",
        options: ["admin", "customer", "employee", "manager"]
      })
    }
  }),
  SoftwareVersion: (0, import_core.list)({
    isSingleton: true,
    access: {
      operation: {
        create: isAdmin,
        query: isUser,
        update: isAdmin,
        delete: isAdmin
      }
    },
    fields: {
      version: (0, import_fields.integer)({ validation: { isRequired: true } }),
      iosLink: (0, import_fields.text)(),
      androidLink: (0, import_fields.text)(),
      webLink: (0, import_fields.text)(),
      windowsLink: (0, import_fields.text)(),
      macLink: (0, import_fields.text)(),
      date: (0, import_fields.timestamp)({
        defaultValue: { kind: "now" },
        isOrderable: true
      })
    }
  }),
  Config: (0, import_core.list)({
    isSingleton: true,
    access: {
      operation: {
        create: () => false,
        query: isUser,
        update: isAdmin,
        delete: () => false
      }
    },
    ui: {
      labelField: "name"
    },
    fields: {
      defaultCurrency: (0, import_fields.text)({ defaultValue: "TRY" }),
      extraFieldsProduct: (0, import_fields.json)()
    }
  })
};

// utils/sendmail.ts
var sendMail = async ({ transport, attachment }) => {
  try {
    let mailOptionsClient = {
      from: `"backupsercemdimuhsaebe@huseyinonal.com" <backupsercemdimuhsaebe@huseyinonal.com>`,
      to: ["sercebackupmdimuhasebe@hotmail.com", "backupsercemdimuhsaebe@huseyinonal.com"],
      attachments: attachment,
      subject: "Serce MDI Muhasebe veri taban\u0131 yede\u011Fi",
      text: `Serce MDI Muhasebe veri taban\u0131 yede\u011Fi ${(/* @__PURE__ */ new Date()).toLocaleString("tr-TR")}`
    };
    transport.sendMail(mailOptionsClient, (error, info) => {
      if (error) {
        console.error(error);
        return false;
      } else {
        console.log("Email sent: " + info.response);
        return true;
      }
    });
  } catch (e) {
    console.error(e);
    return false;
  }
};

// keystone.ts
var keystone_default = withAuth(
  (0, import_core2.config)({
    db: {
      provider: "sqlite",
      url: "file:./data.db"
    },
    server: {
      port: 3344,
      cors: {
        origin: [
          "http://localhost:8081",
          "http://localhost:3000",
          "http://localhost:5173",
          "https://serce.mdi-muhasebe.com",
          "https://serceapi.mdi-muhasebe.com"
        ],
        credentials: true
      },
      extendExpressApp: (app, context) => {
        var cron = require("node-cron");
        var nodemailer = require("nodemailer");
        var transport = nodemailer.createTransport({
          host: "mx.huseyinonal.com",
          port: 587,
          secure: false,
          auth: {
            user: "backupsercemdimuhsaebe@huseyinonal.com",
            pass: process.env.MAIL_PASS
          }
        });
        const path = require("path");
        const fs = require("fs");
        const multer = require("multer");
        const UPLOAD_DIR = path.join(__dirname, "uploads");
        if (!fs.existsSync(UPLOAD_DIR)) {
          fs.mkdirSync(UPLOAD_DIR);
        }
        const storage = multer.diskStorage({
          destination: UPLOAD_DIR,
          // @ts-ignore
          filename: (file, cb) => {
            const uniqueName = Date.now() + "-" + (Math.random() * 1e3).toFixed(0) + "-" + file.originalname;
            cb(null, uniqueName);
          }
        });
        const upload = multer({ storage });
        app.post("/rest/upload", upload.single("file"), (req, res) => {
          if (!req.file) {
            return res.status(400).json({ message: "File upload failed" });
          }
          const fileUrl = `${req.protocol}://${req.get("host")}/rest/files/${req.file.filename}`;
          context.lists.File.create({
            data: {
              // @ts-ignore
              filename: req.file.filename,
              // @ts-ignore
              mimetype: req.file.mimetype,
              // @ts-ignore
              encoding: req.file.encoding,
              // @ts-ignore
              size: req.file.size,
              url: fileUrl
            }
          });
          res.json({ fileUrl });
        });
        app.get("/rest/files/:filename", (req, res) => {
          const filePath = path.join(UPLOAD_DIR, req.params.filename);
          if (fs.existsSync(filePath)) {
            res.sendFile(filePath);
          } else {
            res.status(404).json({ message: "File not found" });
          }
        });
        cron.schedule("0 0 */1 * * *", async () => {
          try {
            const backupDir = path.join(__dirname, "backup");
            if (!fs.existsSync(backupDir)) {
              fs.mkdirSync(backupDir);
            }
            const timestamp2 = (/* @__PURE__ */ new Date()).toISOString().replace(/[-:.]/g, "");
            const backupFilePath = path.join(backupDir, `data-${timestamp2}.db`);
            fs.copyFileSync("data.db", backupFilePath);
            const backupFiles = fs.readdirSync(backupDir);
            if (backupFiles.length > 120) {
              backupFiles.sort((a, b) => fs.statSync(path.join(backupDir, a)).mtime.getTime() - fs.statSync(path.join(backupDir, b)).mtime.getTime());
              const backupFilesToDelete = backupFiles.slice(120);
              const fourteenDaysAgo = /* @__PURE__ */ new Date();
              fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
              backupFilesToDelete.forEach((file) => {
                const filePath = path.join(backupDir, file);
                const fileStats = fs.statSync(filePath);
                if (fileStats.mtime < fourteenDaysAgo) {
                  fs.unlinkSync(filePath);
                }
              });
            }
            try {
              sendMail({
                transport,
                attachment: [
                  {
                    filename: "data.db",
                    path: backupFilePath
                  }
                ]
              });
            } catch (error) {
              console.error("Error sending email", error);
            }
          } catch (error) {
            console.error("Error running back-up job", error);
          }
        });
      }
    },
    lists,
    session,
    graphql: {
      bodyParser: {
        limit: "20mb"
      }
    }
  })
);
//# sourceMappingURL=config.js.map

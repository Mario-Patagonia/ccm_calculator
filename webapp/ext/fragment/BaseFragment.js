sap.ui.define(
    [
        "sap/ui/base/ManagedObject",
        "sap/ui/core/Fragment",
        "sap/ui/core/syncStyleClass",
        "sap/ui/model/json/JSONModel",
    ],
    (ManagedObject, Fragment, syncStyleClass, JSONModel) => {
        const DIALOG_MODEL = "dialog";

        const BaseFragment = ManagedObject.extend(
            "zui5ccm.ccmcalculator.ext.fragment.BaseFragment",
            {
                constructor(controller) {
                    ManagedObject.prototype.constructor.call(this);
                    this.controller = controller;
                    this.view = controller.getView();
                },

                exit() {
                    delete this.controller;
                    delete this.fragment;
                    delete this.view;
                },

                async getFragment() {
                    if (!this.fragment) {
                        this.fragment = await Fragment.load({
                            id: this.getView().getId(),
                            name: this.getMetadata().getName(),
                            controller: this,
                        });
                        const oViewModel = new JSONModel({
                            busy: false,
                            busyIndicatorDelay: 0,
                        });
                        this.fragment.setModel(oViewModel, DIALOG_MODEL);
                        this.getView().addDependent(this.fragment);
                        this.fragment.addStyleClass("sapUiSizeCozy");
                    }
                    return this.fragment;
                },

                getController() {
                    return this.controller;
                },

                getView() {
                    return this.view;
                },

                byId(id) {
                    return Fragment.byId(this.getView().getId(), id);
                },

                getDialogModel() {
                    if (!this.fragment) {
                        throw new Error(
                            "Dialog model used before fragment was instantiated!",
                        );
                    }
                    return this.fragment.getModel(DIALOG_MODEL);
                },

                isOpen() {
                    return this.fragment?.isOpen();
                },
            },
        );
        return BaseFragment;
    },
);

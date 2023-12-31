sap.ui.define(
    [
        "zui5ccm/ccmcalculator/model/Constant",
        "zui5ccm/ccmcalculator/util/TempUploadHelper",
        "zui5ccm/ccmcalculator/ext/fragment/ProgressDialog",
        "sap/m/library",
        "sap/m/MessageBox",
    ],
    (Constant, TempUploadHelper, ProgressDialog, mLibrary, MessageBox) => {
        "use strict";

        const columns = Constant.Columns;
        const { ButtonType } = mLibrary;

        return {
            onAfterRendering() {
                const oView = this.getView();

                const oUploadButton = this.byId(
                    oView.createId("action::spreadsheetUploadButton"),
                );
                oUploadButton.setType(ButtonType.Emphasized);

                const oCreateButton = this.byId(oView.createId("addEntry"));
                oCreateButton.setVisible(false);
            },

            /**
             *
             * @returns {zui5ccm.ccmcalculator.util.TempUploadHelper}
             */
            getTempUploadHelper() {
                this.oTempUploadHelper ??= new TempUploadHelper(
                    this.getView().getModel(),
                );
                return this.oTempUploadHelper;
            },

            getProgressDialog() {
                this.oProgressDialog ??= new ProgressDialog(this);
                return this.oProgressDialog;
            },

            async openSpreadsheetUploadDialog(oEvent) {
                this.getView().setBusyIndicatorDelay(0);
                this.getView().setBusy(true);
                this.spreadsheetUpload = await this.getView()
                    .getController()
                    .getOwnerComponent()
                    .createComponent({
                        usage: "spreadsheetImporter",
                        async: true,
                        componentData: {
                            context: this,
                            columns,
                            standalone: true,
                        },
                    });

                this.spreadsheetUpload.openSpreadsheetUploadDialog();
                this.getView().setBusy(false);

                this.spreadsheetUpload.attachUploadButtonPress(
                    this.onUploadButtonPress.bind(this),
                );
            },

            async onUploadButtonPress(oEvent) {
                this.getView().setBusy(true);
                const oUploadHelper = this.getTempUploadHelper();
                const oModel = this.getView().getModel();
                const aRawItems = oEvent.getParameter("rawData");
                const aChunks = oUploadHelper.createChunks(aRawItems);

                const iTotal = aRawItems.length;
                let iToBeDone = iTotal;

                const oDialog = this.getProgressDialog();

                try {
                    oDialog.open(iTotal);
                    for (const oChunk of aChunks) {
                        await oUploadHelper.submitChunk(oChunk);
                        iToBeDone -= oChunk.length;
                        oDialog.update(iTotal - iToBeDone);
                    }
                    const oContext = this.getView().getBindingContext();
                    const [
                        oActionResponse,
                    ] = await this.extensionAPI.invokeActions(
                        "/new_projectflat",
                        oContext,
                    );

                    this.extensionAPI.refreshTable();
                    MessageBox.success("Verarbeitung erfolgreich", {
                        onClose: (sAction) => {
                            if (sAction === MessageBox.Action.CANCEL) {
                                return;
                            }

                            const oResponseContext =
                                oActionResponse.response.context;
                            this.extensionAPI
                                .getNavigationController()
                                .navigateInternal(oResponseContext);
                        },
                        actions: [
                            MessageBox.Action.OK,
                            MessageBox.Action.CANCEL,
                        ],
                    });
                } catch (e) {
                    await oModel.resetChanges();
                    MessageBox.error(e);
                } finally {
                    this.getView().setBusy(false);
                }
            },
        };
    },
);

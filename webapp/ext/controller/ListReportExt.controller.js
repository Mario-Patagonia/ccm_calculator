sap.ui.define([
    "zui5ccm/ccmcalculator/model/Constant",
    "zui5ccm/ccmcalculator/util/TempUploadHelper",
    "sap/m/library",
    "sap/m/MessageBox"
], function (Constant, TempUploadHelper, mLibrary, MessageBox) {
    'use strict';

    const columns = Constant.Columns;
    const ButtonType = mLibrary.ButtonType;

    return {

        onAfterRendering() {
            const oView = this.getView();

            const oUploadButton = this.byId(oView.createId("action::spreadsheetUploadButton"));
            oUploadButton.setType(ButtonType.Emphasized);

            const oCreateButton = this.byId(oView.createId("addEntry"));
            oCreateButton.setVisible(false);
        },

        /**
         * 
         * @returns {zui5ccm.ccmcalculator.util.TempUploadHelper}
         */
        getTempUploadHelper() {
            this.oTempUploadHelper ??= new TempUploadHelper(this.getView().getModel());
            return this.oTempUploadHelper;
        },

        async openSpreadsheetUploadDialog(oEvent) {
            this.getView().setBusyIndicatorDelay(0)
            this.getView().setBusy(true)
            this.spreadsheetUpload = await this.getView().getController().getOwnerComponent().createComponent({
                usage: "spreadsheetImporter",
                async: true,
                componentData: {
                    context: this,
                    columns,
                    standalone: true
                }
            });

            this.spreadsheetUpload.openSpreadsheetUploadDialog();
            this.getView().setBusy(false);

            this.spreadsheetUpload.attachUploadButtonPress(this.onUploadButtonPress.bind(this));
        },

        async onUploadButtonPress(oEvent) {
            this.getView().setBusy(true);
            const oUploadHelper = this.getTempUploadHelper();
            const oModel = this.getView().getModel();
            const aRawItems = oEvent.getParameter("rawData")
            const aChunks = oUploadHelper.createChunks(aRawItems);

            // map all chunks to a request promise
            const aChunkPromises = aChunks.map(oUploadHelper.submitChunk.bind(oUploadHelper));

            try {
                await Promise.all(aChunkPromises);
                const oContext = this.getView().getBindingContext();
                await this.extensionAPI.invokeActions("/new_projectflat", oContext);
                this.extensionAPI.refreshTable();
                MessageBox.success("Verarbeitung erfolgreich");
            } catch (e) {
                await oModel.resetChanges();
                MessageBox.error(e);
            } finally {
                this.getView().setBusy(false);
            }
        },
    };
});
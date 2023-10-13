sap.ui.define([
    "sap/m/MessageBox"
], function (MessageBox) {
    'use strict';

    const batchSize = 100;
    const columns = ["Check Title", "Check Message", "SAP Note Number", "Ref. Object Type", "Ref. Object Name", "Object Type", "Object Name", "Priority", "Package", "Usage Information"];

    return {
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
            const oModel = this.getView().getModel();
            const aChunks = this._createChunks(oEvent.getParameter("rawData"));

            // map all chunks to a request promise
            const aChunkPromises = aChunks.map((aRows) => {
                for (const oRow of aRows) {
                    const oMappedRow = this._mapData(oRow);
                    oModel.createEntry("/ReadinessTmp", {
                        properties: oMappedRow
                    });
                }

                // for each chunk (a bunch of rows) submit the created entries inside a promise
                // promise will be resolved or rejected depending on the response status
                // batch requests will always land in success, even if there was an exception in the backend
                return new Promise((resolve, reject) => {
                    oModel.submitChanges({
                        success: (oData) => {
                            // oData.__batchResponses[0].__changeResponses[0].statusCode (when success)
                            const iStatusCode = +(oData?.__batchResponses?.[0]?.response?.statusCode ?? 200);
                            if (iStatusCode < 300) {
                                resolve();
                            } else {
                                reject(oData?.__batchResponses?.[0]?.response?.body);
                            }
                        },
                        error: (oError) => {
                            // if the response gets here there is probably some other error with the system or the service on a more general level
                            reject();
                        }
                    });
                })
            });

            try {
                await Promise.all(aChunkPromises);
                const oContext = this.getView().getBindingContext();
                this.extensionAPI.invokeActions("/new_projectflat", oContext);
                MessageBox.success("Verarbeitung erfolgreich");
            } catch (e) {
                await oModel.resetChanges();
                MessageBox.error(e);
            } finally {
                this.getView().setBusy(false);
            }
        },

        _createChunks(aItems) {
            const aResult = []
            for (let i = 0; i < aItems.length; i += batchSize) {
                const aChunk = aItems.slice(i, i + batchSize);
                aResult.push(aChunk)
            }
            return aResult;
        },

        _mapData(oRow) {
            return {
                Checktitle: oRow["Check Title"],
                Checkmessage: oRow["Check Message"],
                Sapnote: oRow["SAP Note Number"],
                Referencedobjecttype: oRow["Ref. Object Type"],
                Referencedobjectname: oRow["Ref. Object Name"],
                ObjectType: oRow["Object Type"],
                ObjectName: oRow["Object Name"],
                Priority: oRow["Priority"],
                Developmentpackage: oRow["Package"],
                Used: this._mapUsed(oRow["Usage Information"])
            }
        },

        _mapUsed(sText) {
            return {
                "Used": "X",
                "Unused": "U",
                "Unknown": "R"
            }[sText] ?? ""
        }
    };
});
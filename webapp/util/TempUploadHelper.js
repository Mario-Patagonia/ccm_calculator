sap.ui.define([
    "zui5ccm/ccmcalculator/model/Constant",
    "sap/ui/base/Object"
], function (Constant, BaseObject) {
    "use strict";

    return BaseObject.extend("zui5ccm.ccmcalculator.util.TempUploadHelper", {

        constructor: function (oModel) {
            BaseObject.apply(this);
            this.oModel = oModel;
        },

        submitChunk(aRows) {
            for (const oRow of aRows) {
                const oMappedRow = this._mapData(oRow);
                this.oModel.createEntry("/ReadinessTmp", {
                    properties: oMappedRow
                });
            }

            return new Promise((resolve, reject) => {
                this.oModel.submitChanges({
                    success: (oData) => {
                        // batch requests will always land in success, even if there was an exception in the backend
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
            });
        },

        /**
         * Split array into smaller chunks
         * 
         * @param {object[]} aItems 
         * @returns {object[][]}
         */
        createChunks(aItems) {
            const aResult = []
            for (let i = 0; i < aItems.length; i += Constant.BatchSize) {
                const aChunk = aItems.slice(i, i + Constant.BatchSize);
                aResult.push(aChunk)
            }
            return aResult;
        },

        /**
         * Convert property names of XLSX rows to entities
         * @param {object} oRow 
         * @returns {object}
         */
        _mapData(oRow) {
            return {
                Checktitle: oRow["Check Title"],
                Checkmessage: oRow["Check Message"],
                Sapnote: oRow["SAP Note Number"],
                Referencedobjecttype: oRow["Ref. Object Type"] ?? oRow["Referenced Object Type"],
                Referencedobjectname: oRow["Ref. Object Name"] ?? oRow["Referenced Object"],
                ObjectType: oRow["Object Type"],
                ObjectName: oRow["Object Name"] ?? oRow["Object name"],
                Priority: oRow["Priority"],
                Developmentpackage: oRow["Package"],
                Used: this._mapUsed(oRow["Usage Information"])
            }
        },

        /**
         * Convert values so they match domain ZCCM_OBJECT_USED
         * @param {string} sText 
         * @returns {string}
         */
        _mapUsed(sText) {
            return {
                Used: "X",
                Unused: "U",
                Unknown: "R"
            }[sText] ?? "X"
        }
    });
});
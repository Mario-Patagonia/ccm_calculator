sap.ui.define([
    "zui5ccm/ccmcalculator/model/Constant",
    "sap/ui/base/Object"
], function (Constant, BaseObject) {
    "use strict";

    const oMapping = {
        Checktitle: {
            SourceKeys: ["Check Title", "Prüftitel"],
            Converter: x => x
        },
        Checkmessage: {
            SourceKeys: ["Check Message", "Prüfmeldung"],
            Converter: x => x
        },
        Sapnote: {
            SourceKeys: ["SAP Note Number", "Hinweis", "SAP-Hinweisnummer"],
            Converter: x =>  x ? `${x}` : ''
        },
        Referencedobjecttype: {
            SourceKeys: ["Ref. Object Type", "Referenced Object Type", "RObT", "Referenz. Objekttyp"],
            Converter: x => x
        },
        Referencedobjectname: {
            SourceKeys: ["Ref. Object Name", "Referenced Object", "Referenzobjekt", "Referenz. Obj.-Name"],
            Converter: x => x
        },
        ObjectType: {
            SourceKeys: ["Object Type", "Obj", "Objekttyp"],
            Converter: x => x
        },
        ObjectName: {
            SourceKeys: ["Object Name", "Object name", "Objektname"],
            Converter: x => x
        },
        Priority: {
            SourceKeys: ["Priority", "Priorität"],
            Converter: x => x
        },
        Developmentpackage: {
            SourceKeys: ["Package", "Paket"],
            Converter: x => x
        },
        Used: {
            SourceKeys: ["Usage Information", "Verwendungsinformation"],
            Converter: x => ({
                Referenced: "X",
                Referenziert: "X",
                Used: "X",
                Verwendet: "X",
                Unused: "U",
                "Nicht verwendet": "U",
                Unknown: "R",
                Unbekannt: "R",
            }[x] ?? "X")
        },
    }

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
            return Object.keys(oMapping)
                .reduce((oCurr, sTargetKey) => {
                    const oKeyMapping = oMapping[sTargetKey];
                    const sSourceKey = oKeyMapping.SourceKeys.find(sSourceKey => oRow[sSourceKey]);
                    oCurr[sTargetKey] = oKeyMapping.Converter(oRow[sSourceKey]) ?? "";
                    return oCurr;
                }, {});
        }
    });
});
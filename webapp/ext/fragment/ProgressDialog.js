sap.ui.define(
    [
        "./BaseFragment",
    ],
    (BaseFragment) => {
        const DraftDialog = BaseFragment.extend(
            "zui5ccm.ccmcalculator.ext.fragment.ProgressDialog",
            {
                async open(iTotal) {
                    (await this.getFragment()).open();
                    this.getDialogModel().setProperty("/total", iTotal);
                    this.getDialogModel().setProperty("/percentVal", 0);
                    this.getDialogModel().setProperty("/displayVal", 0);

                    return this;
                },

                update(iCurrent) {
                    const iTotal = this.getDialogModel().getProperty("/total");
                    const iPercent = Math.floor((iCurrent / iTotal) * 100);
                    this.getDialogModel().setProperty("/percentVal", iPercent);
                    this.getDialogModel().setProperty("/displayVal", iCurrent);

                    if (iCurrent === iTotal) {
                        this.fragment.close();
                    }
                },
            },
        );
        return DraftDialog;
    },
);

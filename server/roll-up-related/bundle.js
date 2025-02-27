'use strict';

Object.defineProperty(exports, "__esModule", { value: true });
const test_excel_server_1 = require("./main/test-excel.server");
const main_no_tcpip_check_param_server_1 = require("./main/main-no-tcpip-check-param.server");
const isProduction_1 = require("./isProduction");
const cms_server_1 = require("./main/cms.server");
const ocr_client_1 = require("./main/ocr.client");
const qnx_server_1 = require("./main/qnx.server");
const main_service_1 = require("./main-service");
console.log(isProduction_1.procStartMsg); //cms連上線的時候會正式傳一次到log
cms_server_1.cmsLib.hostCmsServerP().then(() => {
    test_excel_server_1.hostTestExeclFileServer();
    main_no_tcpip_check_param_server_1.hostParamCheckServer();
    setTimeout(() => {
        ocr_client_1.ocrLib.firstConnectToOcrP().then(() => {
            cms_server_1.cmsLib.tellOcrConnected();
        });
    }, 3000);
    qnx_server_1.qnxLib.serve();
    main_service_1.mainService.detectRecipeFromIT();
});

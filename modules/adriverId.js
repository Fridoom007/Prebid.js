/**
 * This module adds adriverId Real Time User Sync to the User ID module
 * The {@link module:modules/userId} module is required
 * @module modules/adriverId
 * @requires module:modules/userId
 */

import * as utils from '../src/utils.js'
import {submodule} from '../src/hook.js';
import {getStorageManager} from '../src/storageManager.js';
import {ajaxBuilder} from '../src/ajax.js';

const gvlid = 375;
const MODULE_NAME = 'adriverId';
export const storage = getStorageManager(gvlid, MODULE_NAME);

const bididStorageKey = 'adriverId';
const cookiesMaxAge = 13 * 30 * 24 * 60 * 60 * 1000;

const pastDateString = new Date(0).toString();
const expirationString = new Date(utils.timestamp() + cookiesMaxAge).toString();

function getFromAllStorages(key) {
  return storage.getCookie(key) || storage.getDataFromLocalStorage(key);
}

function saveOnAllStorages(key, value) {
  if (key && value) {
    storage.setCookie(key, value, expirationString);
    storage.setDataInLocalStorage(key, value);
  }
}

function deleteFromAllStorages(key) {
  storage.setCookie(key, '', pastDateString);
  storage.removeDataFromLocalStorage(key);
}

function getAdriverIdDataFromAllStorages() {
  return {
    adriverId: getFromAllStorages(bididStorageKey),
  }
}

function callAdriverUserSync() {
  const url = 'https://sspid.adriver.ru/adriverid';

  const ajax = ajaxBuilder();

  ajax(url, {
    success: response => {
      const jsonResponse = JSON.parse(response);
      if (jsonResponse.adriverid) {
        saveOnAllStorages(bididStorageKey, jsonResponse.adriverid);
      } else {
        deleteFromAllStorages(bididStorageKey);
      }
    },
    undefined,
    headers: {
      method: 'GET',
      contentType: 'application/json',
      withCredentials: true
    }
  });
}

/** @type {Submodule} */
export const adriverIdSubmodule = {
  /**
   * used to link submodule with config
   * @type {string}
   */
  name: MODULE_NAME,
  gvlid: gvlid,
  /**
   * decode the stored id value for passing to bid requests
   * @function
   * @returns {{adriverId: string} | undefined}
   */
  decode(bidId) {
    return bidId;
  },
  /**
   * get the adriver Id from local storages and initiate a new user sync
   * @function
   * @param {SubmoduleConfig} [config]
   * @param {ConsentData} [consentData]
   * @returns {{id: {adriverId: string} | undefined}}}
   */
  getId(config, consentData) {
    // const hasGdprData = consentData && typeof consentData.gdprApplies === 'boolean' && consentData.gdprApplies;

    const localData = getAdriverIdDataFromAllStorages();
    callAdriverUserSync();

    return {id: localData ? {adriverId: localData.adriverId} : undefined}
  }
};

submodule('userId', adriverIdSubmodule);

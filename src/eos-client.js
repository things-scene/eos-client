/*
 * Copyright © HatioLab Inc. All rights reserved.
 */

import COMPONENT_IMAGE from './eos-client.png';

import { Component, DataSource, RectPath, Shape } from '@hatiolab/things-scene'
import Eos from 'eosjs-api';

const NATURE = {
  mutable: false,
  resizable: true,
  rotatable: true,
  properties: [{
    type: 'string',
    label: 'http-endpoint',
    name: 'httpEndpoint',
    placeholder: 'http://127.0.0.1:8888 or https://api.eosnewyork.io:443'
  }, {
    type: 'string',
    label: 'key-provider',
    name: 'keyProvider'
  }, {
    type: 'checkbox',
    label: 'verbose',
    name: 'verbose'
  }, {
    type: 'string',
    label: 'block-num',
    name: 'blockNum'
  }],
  'value-property': 'blockNum'
}

export default class EosClient extends DataSource(RectPath(Shape)) {

  static get image() {
    if (!EosClient._image) {
      EosClient._image = new Image();
      EosClient._image.src = COMPONENT_IMAGE;
    }

    return EosClient._image;
  }

  ready() {
    super.ready();

    if (!this.app.isViewMode)
      return;

    this._initEosClientConnection();
  }

  _initEosClientConnection() {

    try {
      this._client && this._client.end(true, () => { });
    } catch (e) {
      console.error(e)
    }
    delete this._client;

    var {
      httpEndpoint = 'https://api.eosnewyork.io:443',
      verbose
    } = this.model

    var chainId

    Eos().getInfo((error, info) => {
      if (error) {
        console.error(error, info)
      } else {
        console.info('EOS info', info)
        chainId = info.chainId
      }
    })

    var client = Eos({
      chainId,
      httpEndpoint,
      verbose
    });

    this._client = client;
  }

  dispose() {
    delete this._client;

    super.dispose()
  }

  render(context) {

    /*
     * TODO role이 publisher 인지 subscriber 인지에 따라서 구분할 수 있는 표시를 추가할 것.
     */

    var {
      left,
      top,
      width,
      height
    } = this.bounds;

    context.beginPath();
    context.drawImage(EosClient.image, left, top, width, height);
  }

  get blockNum() {
    return this._blockNum
  }

  set blockNum(blockNum) {
    this._blockNum = blockNum

    if (this._client) {
      requestAnimationFrame(async () => {
        this.setState('data', await this._client.getBlock(blockNum))
      })
    }
  }

  async onclick() {
    Eos().getInfo((error, info) => {
      if (error) {
        console.error(error, info)
      } else {
        console.log('last-irreversible-block-num', info.last_irreversible_block_num)
        this.blockNum = info.last_irreversible_block_num
      }
    })

  }

  get nature() {
    return NATURE;
  }

}

Component.register('eos-client', EosClient);

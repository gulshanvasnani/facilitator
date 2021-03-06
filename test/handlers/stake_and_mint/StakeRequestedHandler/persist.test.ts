// Copyright 2019 OpenST Ltd.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// ----------------------------------------------------------------------------


import BigNumber from 'bignumber.js';
import sinon from 'sinon';
import * as Web3Utils from 'web3-utils';

import StakeRequestedHandler from '../../../../src/handlers/stake_and_mint/StakeRequestedHandler';
import MessageTransferRequest from '../../../../src/models/MessageTransferRequest';
import MessageTransferRequestRepository, { RequestType } from '../../../../src/repositories/MessageTransferRequestRepository';
import assert from '../../../test_utils/assert';
import SpyAssert from '../../../test_utils/SpyAssert';

describe('StakeRequestedHandler.persist()', (): void => {
  it('should persist successfully when stakeRequesteds is received first time for'
    + ' requestHash', async (): Promise<void> => {
    const gatewayAddress = '0x0000000000000000000000000000000000000002';
    const transactions = [{
      id: '1',
      stakeRequestHash: Web3Utils.sha3('1'),
      amount: '10',
      beneficiary: '0x0000000000000000000000000000000000000001',
      gasPrice: '1',
      gasLimit: '1',
      nonce: '1',
      gateway: gatewayAddress,
      staker: '0x0000000000000000000000000000000000000003',
      stakerProxy: '0x0000000000000000000000000000000000000004',
      blockNumber: '10',
    }];

    const saveStub = sinon.stub();
    const sinonMock = sinon.createStubInstance(MessageTransferRequestRepository, {
      save: saveStub as any,
    });
    const handler = new StakeRequestedHandler(
      sinonMock as any,
      gatewayAddress,
    );

    const models = await handler.persist(transactions);

    const stakeRequest = new MessageTransferRequest(
      transactions[0].stakeRequestHash,
      RequestType.Stake,
      new BigNumber(transactions[0].amount),
      new BigNumber(transactions[0].blockNumber),
      Web3Utils.toChecksumAddress(transactions[0].beneficiary),
      new BigNumber(transactions[0].gasPrice),
      new BigNumber(transactions[0].gasLimit),
      new BigNumber(transactions[0].nonce),
      Web3Utils.toChecksumAddress(transactions[0].gateway),
      Web3Utils.toChecksumAddress(transactions[0].staker),
      Web3Utils.toChecksumAddress(transactions[0].stakerProxy),
    );

    assert.equal(
      models.length,
      transactions.length,
      'Number of models must be equal to transactions',
    );
    assert.deepStrictEqual(models[0], stakeRequest);
    SpyAssert.assert(saveStub, 1, [[stakeRequest]]);
    sinon.restore();
  });

  it('should update messageHash(null) and blockNumber when stakeRequest '
    + 'is already present', async (): Promise<void> => {
    const gatewayAddress = '0x0000000000000000000000000000000000000002';
    const transactions1 = [{
      id: '1',
      stakeRequestHash: Web3Utils.sha3('1'),
      amount: '10',
      beneficiary: '0x0000000000000000000000000000000000000001',
      gasPrice: '1',
      gasLimit: '1',
      nonce: '1',
      gateway: gatewayAddress,
      staker: '0x0000000000000000000000000000000000000003',
      stakerProxy: '0x0000000000000000000000000000000000000004',
      blockNumber: '10',
    }];
    const stakeRequest = new MessageTransferRequest(
      transactions1[0].stakeRequestHash,
      RequestType.Stake,
      new BigNumber(transactions1[0].blockNumber),
      new BigNumber(transactions1[0].amount),
      Web3Utils.toChecksumAddress(transactions1[0].beneficiary),
      new BigNumber(transactions1[0].gasPrice),
      new BigNumber(transactions1[0].gasLimit),
      new BigNumber(transactions1[0].nonce),
      Web3Utils.toChecksumAddress(transactions1[0].gateway),
      Web3Utils.toChecksumAddress(transactions1[0].staker),
      Web3Utils.toChecksumAddress(transactions1[0].stakerProxy),
    );

    // Transaction with higher block number.
    const transactions2 = [{
      id: '1',
      stakeRequestHash: Web3Utils.sha3('1'),
      amount: '10',
      beneficiary: '0x0000000000000000000000000000000000000001',
      gasPrice: '1',
      gasLimit: '1',
      nonce: '1',
      gateway: gatewayAddress,
      staker: '0x0000000000000000000000000000000000000003',
      stakerProxy: '0x0000000000000000000000000000000000000004',
      blockNumber: '11',
    }];

    const stakeRequestWithNullMessageHash = new MessageTransferRequest(
      transactions2[0].stakeRequestHash,
      RequestType.Stake,
      new BigNumber(transactions2[0].blockNumber),
      new BigNumber(transactions2[0].amount),
      Web3Utils.toChecksumAddress(transactions2[0].beneficiary),
      new BigNumber(transactions2[0].gasPrice),
      new BigNumber(transactions2[0].gasLimit),
      new BigNumber(transactions2[0].nonce),
      Web3Utils.toChecksumAddress(transactions2[0].gateway),
      Web3Utils.toChecksumAddress(transactions2[0].staker),
      Web3Utils.toChecksumAddress(transactions2[0].stakerProxy),
      '', // Message hash should be blank string.
    );

    const sinonMock = sinon.createStubInstance(MessageTransferRequestRepository, {});
    const handler = new StakeRequestedHandler(sinonMock as any, gatewayAddress);

    sinonMock.get.returns(Promise.resolve(null));
    sinonMock.save.returns(Promise.resolve(stakeRequest));
    const models1 = await handler.persist(transactions1);

    const stakeRequestWithMessageHash = Object.assign({}, stakeRequest);
    stakeRequestWithMessageHash.messageHash = 'messageHash';

    sinonMock.get.returns(Promise.resolve(stakeRequestWithMessageHash));
    sinonMock.save.returns(Promise.resolve(stakeRequestWithNullMessageHash));
    const models2 = await handler.persist(transactions2);

    assert.equal(
      models1.length,
      transactions1.length,
      'Number of models must be equal to transactions',
    );

    assert.equal(
      models2.length,
      transactions2.length,
      'Number of models must be equal to transactions',
    );

    assert.deepStrictEqual(models1[0], stakeRequest);

    assert.deepStrictEqual(models2[0], stakeRequestWithNullMessageHash);

    SpyAssert.assert(sinonMock.get, 2, [
      [transactions1[0].stakeRequestHash], [transactions2[0].stakeRequestHash],
    ]);

    SpyAssert.assert(sinonMock.save, 2, [
      [stakeRequest], [stakeRequestWithNullMessageHash],
    ]);
    sinon.restore();
  });
});

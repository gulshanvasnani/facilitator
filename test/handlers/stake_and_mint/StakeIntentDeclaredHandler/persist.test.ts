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

import StakeIntentDeclaredHandler from '../../../../src/handlers/stake_and_mint/StakeIntentDeclaredHandler';
import Message from '../../../../src/models/Message';
import {
  MessageDirection, MessageRepository, MessageStatus, MessageType,
} from '../../../../src/repositories/MessageRepository';
import assert from '../../../test_utils/assert';
import SpyAssert from '../../../test_utils/SpyAssert';

describe('StakeIntentDeclaredHandler.persist()', (): void => {
  const transactions = [{
    _messageHash: Web3Utils.keccak256('1'),
    _staker: '0x0000000000000000000000000000000000000001',
    _stakerNonce: '1',
    _beneficiary: '0x0000000000000000000000000000000000000002',
    _amount: '100',
    contractAddress: '0x0000000000000000000000000000000000000002',
    blockNumber: '10',
  }];

  it('should change message source state to Declared if message does not exist',
    async (): Promise<void> => {
      const save = sinon.stub();

      const mockedRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(null),
        });
      const handler = new StakeIntentDeclaredHandler(mockedRepository as any);

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sender = transactions[0]._staker;
      expectedModel.nonce = new BigNumber(transactions[0]._stakerNonce);
      expectedModel.sourceStatus = MessageStatus.Declared;
      expectedModel.gatewayAddress = transactions[0].contractAddress;
      expectedModel.sourceDeclarationBlockHeight = new BigNumber(transactions[0].blockNumber);

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(mockedRepository.get, 1, [[transactions[0]._messageHash]]);
    });

  it('should change message source state to Declared if message status is Undeclared',
    async (): Promise<void> => {
      const save = sinon.stub();

      const existingMessageWithUndeclaredStatus = new Message(
        Web3Utils.keccak256('1'),
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      existingMessageWithUndeclaredStatus.sourceStatus = MessageStatus.Undeclared;
      const mockedRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(existingMessageWithUndeclaredStatus),
        });
      const handler = new StakeIntentDeclaredHandler(mockedRepository as any);

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sourceStatus = MessageStatus.Declared;
      expectedModel.sourceDeclarationBlockHeight = new BigNumber(transactions[0].blockNumber);

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(mockedRepository.get, 1, [[transactions[0]._messageHash]]);
    });

  it('should not change message source state to Declared if current status is Progressed',
    async (): Promise<void> => {
      const save = sinon.stub();

      const existingMessageWithProgressStatus = new Message(
        Web3Utils.keccak256('1'),
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      existingMessageWithProgressStatus.sourceStatus = MessageStatus.Progressed;
      const mockedRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(existingMessageWithProgressStatus),
        });
      const handler = new StakeIntentDeclaredHandler(mockedRepository as any);

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sourceStatus = MessageStatus.Progressed;

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(mockedRepository.get, 1, [[transactions[0]._messageHash]]);
    });

  it('should not change message state if current status is already Declared',
    async (): Promise<void> => {
      const save = sinon.stub();

      const existingMessageWithProgressStatus = new Message(
        Web3Utils.keccak256('1'),
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      existingMessageWithProgressStatus.sourceStatus = MessageStatus.Declared;
      const mockedRepository = sinon.createStubInstance(MessageRepository,
        {
          save: save as any,
          get: Promise.resolve(existingMessageWithProgressStatus),
        });
      const handler = new StakeIntentDeclaredHandler(mockedRepository as any);

      const models = await handler.persist(transactions);

      const expectedModel = new Message(
        transactions[0]._messageHash,
        MessageType.Stake,
        MessageDirection.OriginToAuxiliary,
      );
      expectedModel.sourceStatus = MessageStatus.Declared;

      assert.equal(
        models.length,
        transactions.length,
        'Number of models must be equal to transactions',
      );
      SpyAssert.assert(save, 1, [[expectedModel]]);
      SpyAssert.assert(mockedRepository.get, 1, [[transactions[0]._messageHash]]);
    });
});

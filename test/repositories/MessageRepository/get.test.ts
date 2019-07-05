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

import 'mocha';
import BigNumber from 'bignumber.js';

import {
  MessageAttributes,
  Message,
  MessageDirection,
  MessageStatus,
  MessageType,
} from '../../../src/repositories/MessageRepository';
import Repositories from '../../../src/repositories/Repositories';

import Util from './util';

import assert from '../../test_utils/assert';

interface TestConfigInterface {
  repos: Repositories;
}
let config: TestConfigInterface;

describe('MessageRepository::get', (): void => {
  beforeEach(async (): Promise<void> => {
    config = {
      repos: await Repositories.create(),
    };
  });

  it('Checks retrieval of an existing message.', async (): Promise<void> => {
    const messageAttributes: MessageAttributes = {
      messageHash: '0x000000000000000000000000000000000000000000000000000001',
      type: MessageType.Stake,
      gatewayAddress: '0x0000000000000000000000000000000000000001',
      sourceStatus: MessageStatus.Declared,
      targetStatus: MessageStatus.Undeclared,
      gasPrice: new BigNumber('1'),
      gasLimit: new BigNumber('1'),
      nonce: new BigNumber('1'),
      sender: '0x0000000000000000000000000000000000000002',
      direction: MessageDirection.OriginToAuxiliary,
      sourceDeclarationBlockHeight: new BigNumber('1'),
    };

    await config.repos.messageRepository.create(
      messageAttributes,
    );

    const message = await config.repos.messageRepository.get(
      messageAttributes.messageHash,
    );

    assert.notStrictEqual(
      message,
      null,
      'Message should exist as it has been just created.',
    );

    Util.checkMessageAgainstAttributes(
      message as Message,
      messageAttributes,
    );
  });

  it('Checks retrieval of non-existing message.', async (): Promise<void> => {
    const nonExistingMessageHash = 'nonExistingMessageHash';
    const message = await config.repos.messageRepository.get(
      nonExistingMessageHash,
    );

    assert.strictEqual(
      message,
      null,
      'Message  with \'nonExistingMessageHash\' does not exist.',
    );
  });
});
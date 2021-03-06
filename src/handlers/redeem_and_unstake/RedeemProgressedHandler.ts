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

import Logger from '../../Logger';
import Message from '../../models/Message';
import {
  MessageDirection, MessageRepository, MessageStatus, MessageType,
} from '../../repositories/MessageRepository';
import ContractEntityHandler from '../ContractEntityHandler';
import Utils from '../../Utils';

/**
 * This class handles redeem progress transactions.
 */
export default class RedeemProgressedHandler extends ContractEntityHandler<Message> {
  /* Storage */

  private readonly messageRepository: MessageRepository;

  public constructor(messageRepository: MessageRepository) {
    super();

    this.messageRepository = messageRepository;
  }

  /**
   * This method parses progress redeem transaction and returns message model object.
   *
   * @param transactions Transaction objects.
   *
   * @return Array of instances of message model objects.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async persist(transactions: any[]): Promise<Message[]> {
    Logger.debug('Persisting Redeem progress records');
    const models: Message[] = await Promise.all(transactions.map(
      async (transaction): Promise<Message> => {
        let message = await this.messageRepository.get(transaction._messageHash);
        // This can happen if progress transaction is received first from graph node.
        if (message === null) {
          message = new Message(
            transaction._messageHash,
            MessageType.Redeem,
            MessageDirection.AuxiliaryToOrigin,
          );
          message.sender = Utils.toChecksumAddress(transaction._redeemer);
          message.nonce = new BigNumber(transaction._redeemerNonce);
          message.gatewayAddress = Utils.toChecksumAddress(transaction.contractAddress);
          message.sourceStatus = MessageStatus.Undeclared;
          Logger.debug(`Creating a new message for message hash ${transaction._messageHash}`);
        }
        // Undeclared use case can happen when progress event appears before confirmRedeem event.
        if (message.sourceStatus === MessageStatus.Undeclared
          || message.sourceStatus === MessageStatus.Declared) {
          message.sourceStatus = MessageStatus.Progressed;
        }
        message.secret = transaction._unlockSecret;
        return message;
      },
    ));

    const savePromises = [];
    for (let i = 0; i < models.length; i += 1) {
      Logger.debug(`Changing source status to progress for message hash ${models[i].messageHash}`);
      savePromises.push(this.messageRepository.save(models[i]));
    }

    await Promise.all(savePromises);
    Logger.debug('Messages saved');
    return models;
  }
}

/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { endpoint, isSelfHosted } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { route } from '$app/common/helpers/route';
import { Modal } from '$app/components/Modal';
import { Button, Link } from '$app/components/forms';
import { Icon } from '$app/components/icons/Icon';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MdLink } from 'react-icons/md';
import yodleeLogo from '/dap-logos/yodlee.svg';
import goCardlessLogo from '/dap-logos/goCardless.png';
import { useAccentColor } from '$app/common/hooks/useAccentColor';
import { useClickAway } from 'react-use';
import { useColorScheme } from '$app/common/colors';
import { enterprisePlan } from '$app/common/guards/guards/enterprise-plan';
import { ConnectUpBank } from './ConnectUpBank';

export function ConnectAccounts() {
  const [t] = useTranslation();
  const accentColor = useAccentColor();

  const colors = useColorScheme();

  const divRef = useRef<HTMLDivElement>(null);

  const [account, setAccount] = useState<'yodlee' | 'nordigen' | 'upbank'>();
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [showUpBankModal, setShowUpBankModal] = useState<boolean>(false);

  useClickAway(divRef, () => {
    setAccount(undefined);
  });

  const handleClose = () => {
    setIsModalVisible(false);
    setAccount(undefined);
  };

  const handleConnectYodlee = () => {
    request('POST', endpoint('/api/v1/one_time_token'), {
      context: 'yodlee',
      platform: 'react',
    }).then((tokenResponse) => {
      handleClose();

      window.open(
        route('https://invoicing.co/yodlee/onboard/:hash', {
          hash: tokenResponse?.data?.hash,
        })
      );
    });
  };

  const handleConnectNordigen = () => {
    request('POST', endpoint('/api/v1/one_time_token'), {
      context: 'nordigen',
      platform: 'react',
    }).then((tokenResponse) => {
      handleClose();

      window.open(
        endpoint('/nordigen/connect/:hash', {
          hash: tokenResponse?.data?.hash,
        })
      );
    });
  };

  const handleConnectUpBank = () => {
    handleClose();
    setShowUpBankModal(true);
  };

  const handleConnectAccount = () => {
    if (account === 'yodlee') {
      handleConnectYodlee();
    }

    if (account === 'nordigen') {
      handleConnectNordigen();
    }

    if (account === 'upbank') {
      handleConnectUpBank();
    }
  };

  return (
    <>
      <Button
        type="secondary"
        onClick={() => setIsModalVisible(true)}
      >
        <span className="mr-2">{<Icon element={MdLink} size={20} />}</span>
        {t('connect_accounts')}
      </Button>

      <Modal
        title={t('connect_accounts')}
        visible={isModalVisible}
        onClose={handleClose}
      >
        <div ref={divRef} className="flex flex-col space-y-6">
          {enterprisePlan() && (
            <div
              className="flex flex-col cursor-pointer border-4"
              style={{
                borderColor: account === 'yodlee' ? accentColor : colors.$5,
                height: '10.25rem',
              }}
              onClick={() => setAccount('yodlee')}
            >
              <img className="h-32" src={yodleeLogo} />

              <div
                className="flex items-center justify-center space-x-2 text-xs pb-3"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="text-gray-500">{t('yodlee_regions')}.</p>

                <Link
                  className="text-xs"
                  to="https://www.yodlee.com/open-banking/data-connections"
                  external
                >
                  {t('learn_more')}.
                </Link>
              </div>
            </div>
          )}

          {enterprisePlan() && (
            <div
              data-cy="nordigenBox"
              className="flex flex-col items-center cursor-pointer border-4"
              style={{
                borderColor: account === 'nordigen' ? accentColor : colors.$5,
                height: '10.25rem',
              }}
              onClick={() => setAccount('nordigen')}
            >
              <div className="flex flex-1 items-center justify-center">
                <img src={goCardlessLogo} style={{ width: '15rem' }} />
              </div>

              <div
                className="flex items-center justify-center space-x-2 text-xs pb-3"
                onClick={(event) => event.stopPropagation()}
              >
                <p className="text-gray-500">{t('nordigen_regions')}.</p>

                <Link
                  className="text-xs"
                  to="https://gocardless.com/bank-account-data/coverage/"
                  external
                >
                  {t('learn_more')}.
                </Link>
              </div>
            </div>
          )}

          {/* UP Bank Option - Available for Australian users */}
          <div
            data-cy="upbankBox"
            className="flex flex-col items-center cursor-pointer border-4"
            style={{
              borderColor: account === 'upbank' ? accentColor : colors.$5,
              height: '10.25rem',
            }}
            onClick={() => setAccount('upbank')}
          >
            <div className="flex flex-1 items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="text-4xl font-bold" style={{ color: '#FF7A64' }}>
                  UP
                </div>
                <div className="text-sm text-gray-600">Bank</div>
              </div>
            </div>

            <div
              className="flex items-center justify-center space-x-2 text-xs pb-3"
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-gray-500">Australia only - Personal Access Token required.</p>

              <Link
                className="text-xs"
                to="https://up.com.au/api/"
                external
              >
                {t('learn_more')}.
              </Link>
            </div>
          </div>

          <Button
            onClick={handleConnectAccount}
            disableWithoutIcon
            disabled={!account}
          >
            {t('connect')}
          </Button>
        </div>
      </Modal>

      {/* UP Bank Connection Modal */}
      <ConnectUpBank
        visible={showUpBankModal}
        onClose={() => setShowUpBankModal(false)}
      />
    </>
  );
}
/**
 * Invoice Ninja (https://invoiceninja.com).
 *
 * @link https://github.com/invoiceninja/invoiceninja source repository
 *
 * @copyright Copyright (c) 2022. Invoice Ninja LLC (https://invoiceninja.com)
 *
 * @license https://www.elastic.co/licensing/elastic-license
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '$app/components/Modal';
import { Button, InputField, Link } from '$app/components/forms';
import { endpoint } from '$app/common/helpers';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { AxiosError } from 'axios';
import { Alert } from '$app/components/Alert';
import { useNavigate } from 'react-router-dom';

interface ConnectUpBankProps {
  visible: boolean;
  onClose: () => void;
}

interface UpBankAccount {
  id: string;
  account_name: string;
  account_type: string;
  current_balance: number;
  account_currency: string;
  nickname: string;
}

export function ConnectUpBank({ visible, onClose }: ConnectUpBankProps) {
  const [t] = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState<'token' | 'accounts' | 'success'>('token');
  const [accessToken, setAccessToken] = useState('');
  const [encryptedToken, setEncryptedToken] = useState('');
  const [accounts, setAccounts] = useState<UpBankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setStep('token');
    setAccessToken('');
    setEncryptedToken('');
    setAccounts([]);
    setSelectedAccount('');
    onClose();
  };

  const handleConnectToken = async () => {
    if (!accessToken.trim()) {
      toast.error('Please enter your UP Bank Personal Access Token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await request('POST', endpoint('/api/v1/upbank/connect'), {
        access_token: accessToken,
      });

      if (response.data.accounts && response.data.accounts.length > 0) {
        setAccounts(response.data.accounts);
        setEncryptedToken(response.data.access_token);
        setStep('accounts');
      } else {
        toast.error('No UP Bank accounts found');
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        'Failed to connect to UP Bank. Please check your token.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAccount = async () => {
    if (!selectedAccount) {
      toast.error('Please select an account to connect');
      return;
    }

    setIsLoading(true);

    try {
      await request('POST', endpoint('/api/v1/upbank/store'), {
        account_id: selectedAccount,
        access_token: encryptedToken,
      });

      toast.success('UP Bank account connected successfully!');
      setStep('success');
      
      // Refresh the page after a short delay to show the new bank account
      setTimeout(() => {
        handleClose();
        window.location.reload();
      }, 2000);
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string; error?: string }>;
      const errorMessage = 
        axiosError.response?.data?.message || 
        axiosError.response?.data?.error || 
        'Failed to connect UP Bank account';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency || 'AUD',
    }).format(amount);
  };

  return (
    <Modal
      title="Connect UP Bank Account"
      visible={visible}
      onClose={handleClose}
      size="regular"
    >
      <div className="flex flex-col space-y-6">
        {step === 'token' && (
          <>
            <Alert type="info">
              <p className="mb-2">To connect your UP Bank account, you'll need a Personal Access Token.</p>
              <p className="mb-2">
                <strong>How to get your token:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Open the UP mobile app</li>
                <li>Go to Settings → UP API → Personal Access Tokens</li>
                <li>Create a new token and copy it</li>
                <li>Paste it below</li>
              </ol>
              <p className="mt-2">
                <Link to="https://up.com.au/api/" external>
                  Learn more about UP Bank API
                </Link>
              </p>
            </Alert>

            <InputField
              label="Personal Access Token"
              value={accessToken}
              onValueChange={setAccessToken}
              type="password"
              placeholder="up:yeah:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              required
            />

            <div className="flex justify-end space-x-4">
              <Button type="secondary" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleConnectToken}
                disabled={!accessToken.trim() || isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </>
        )}

        {step === 'accounts' && (
          <>
            <Alert type="info">
              Select which UP Bank account you want to connect to Invoice Ninja.
            </Alert>

            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedAccount === account.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => setSelectedAccount(account.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{account.nickname || account.account_name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {account.account_type === 'bank' ? 'Transaction Account' : 
                         account.account_type === 'savings' ? 'Savings Account' : 
                         account.account_type}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatCurrency(account.current_balance, account.account_currency)}
                      </p>
                      <p className="text-xs text-gray-500">Current Balance</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="secondary" onClick={() => setStep('token')}>
                Back
              </Button>
              <Button
                onClick={handleSelectAccount}
                disabled={!selectedAccount || isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect Account'}
              </Button>
            </div>
          </>
        )}

        {step === 'success' && (
          <>
            <Alert type="success">
              <p>Your UP Bank account has been connected successfully!</p>
              <p className="mt-2">Transactions are being imported in the background.</p>
            </Alert>

            <div className="flex justify-center">
              <Button onClick={handleClose}>
                Done
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
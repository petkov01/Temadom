import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, XCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const PaymentSuccessPage = () => {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [status, setStatus] = useState('checking');
  const sessionId = params.get('session_id');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!sessionId || !token) { setStatus('error'); return; }
    let attempts = 0;
    const poll = async () => {
      if (attempts >= 5) { setStatus('timeout'); return; }
      attempts++;
      try {
        const res = await axios.get(`${API}/payments/checkout/status/${sessionId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.payment_status === 'paid') {
          setStatus('paid');
        } else if (res.data.status === 'expired') {
          setStatus('expired');
        } else {
          setTimeout(poll, 2000);
        }
      } catch { setStatus('error'); }
    };
    poll();
  }, [sessionId, token]);

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: 'var(--theme-bg)' }}
      data-testid="payment-success-page">
      <Card className="max-w-md w-full" style={{ background: 'var(--theme-card-bg)', border: '1px solid var(--theme-border)' }}>
        <CardContent className="py-12 text-center space-y-4">
          {status === 'checking' && (
            <>
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-[#c9953a]" />
              <h2 className="text-lg font-bold" style={{ color: 'var(--theme-text)' }}>Проверка на плащането...</h2>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Моля изчакайте</p>
            </>
          )}
          {status === 'paid' && (
            <>
              <CheckCircle className="h-16 w-16 mx-auto text-[#10B981]" />
              <h2 className="text-xl font-black" style={{ color: 'var(--theme-text)' }}>Плащането е успешно!</h2>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Вашият абонамент е активиран. Благодарим ви!</p>
              <Button className="bg-[#c9953a] hover:bg-[#b8922e] text-white mt-4" onClick={() => nav('/profile')} data-testid="go-to-profile">
                Към профила
              </Button>
            </>
          )}
          {(status === 'error' || status === 'expired' || status === 'timeout') && (
            <>
              <XCircle className="h-16 w-16 mx-auto text-red-500" />
              <h2 className="text-xl font-black" style={{ color: 'var(--theme-text)' }}>
                {status === 'expired' ? 'Сесията изтече' : 'Грешка при проверка'}
              </h2>
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>Моля опитайте отново или се свържете с нас.</p>
              <Button variant="outline" className="mt-4" onClick={() => nav('/profile')} style={{ borderColor: 'var(--theme-border)' }}>
                Обратно
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;

import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router';
import { FaArrowLeft, FaLock } from 'react-icons/fa';
import { authService } from '~/services/auth.service';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#])[A-Za-z\d@$!%*?&.#]{8,}$/;

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!PASSWORD_PATTERN.test(password)) {
      setMessage({ text: 'Usa al menos 8 caracteres e incluye mayúscula, minúscula, número y símbolo.', success: false });
      return;
    }
    if (password !== confirmation) {
      setMessage({ text: 'Las contraseñas no coinciden.', success: false });
      return;
    }

    setIsSubmitting(true);
    const result = await authService.resetPassword(token, password);
    setMessage({ text: result.message, success: result.success });
    setIsSubmitting(false);
  };

  return (
    <main className="min-h-screen bg-black flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-2xl sm:p-8" aria-labelledby="reset-password-title">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
          <FaLock className="text-2xl" aria-hidden="true" />
        </div>
        <h1 id="reset-password-title" className="mb-3 text-center text-2xl font-bold tracking-wide text-white sm:text-3xl">CREAR CONTRASEÑA NUEVA</h1>

        {!token ? (
          <div className="text-center" role="alert">
            <p className="text-red-300">El enlace de recuperación no es válido o está incompleto.</p>
            <Link to="/forgot-password" className="mt-5 inline-flex items-center text-sm text-blue-400 hover:text-white">
              <FaArrowLeft className="mr-2" aria-hidden="true" />Solicitar otro enlace
            </Link>
          </div>
        ) : message?.success ? (
          <div className="text-center" role="status" aria-live="polite">
            <p className="text-green-300">{message.text}</p>
            <Link to="/login" className="mt-5 inline-flex items-center text-sm text-blue-400 hover:text-white">Ir a iniciar sesión</Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-center text-gray-400">Elige una contraseña nueva para tu cuenta.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-300">Nueva contraseña</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={event => setPassword(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-300">Confirmar contraseña</label>
                <input id="confirm-password" name="confirm-password" type="password" autoComplete="new-password" required minLength={8} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
              </div>
              {message && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{message.text}</p>}
              <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {isSubmitting ? 'ACTUALIZANDO…' : 'ACTUALIZAR CONTRASEÑA'}
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}

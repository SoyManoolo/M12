import { useEffect, useState } from 'react';
import Navbar from '~/components/Inicio/Navbar';
import { FaUsers, FaVideo, FaComments, FaNewspaper, FaCalendarAlt } from 'react-icons/fa';
import { useAuth } from '~/hooks/useAuth';
import { environment } from '~/config/environment';

interface DailyCount {
  date: string;
  count: number;
}

interface AdminStats {
  generatedAt: string;
  periodDays: number;
  totals: { users: number; posts: number; messages: number; videoCalls: number };
  trends: { users: DailyCount[]; posts: DailyCount[]; messages: DailyCount[]; videoCalls: DailyCount[] };
}

const metrics = [
  { key: 'users', label: 'Usuarios', icon: FaUsers, color: 'text-blue-400', fill: 'bg-blue-500' },
  { key: 'posts', label: 'Publicaciones', icon: FaNewspaper, color: 'text-purple-400', fill: 'bg-purple-500' },
  { key: 'messages', label: 'Mensajes', icon: FaComments, color: 'text-green-400', fill: 'bg-green-500' },
  { key: 'videoCalls', label: 'Videollamadas', icon: FaVideo, color: 'text-yellow-400', fill: 'bg-yellow-500' }
] as const;

const numberFormat = new Intl.NumberFormat('es-ES');

export default function AdminEstadisticas() {
  const { token } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${environment.apiUrl}/admin/stats`, {
          credentials: 'include',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok || !result.success || !result.data) {
          throw new Error(result.message || 'No se pudieron cargar las estadísticas.');
        }
        setStats(result.data as AdminStats);
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar las estadísticas.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void loadStats();
    return () => controller.abort();
  }, [token]);

  return (
    <div className="min-h-screen bg-black text-white lg:flex">
      <Navbar />
      <main className="w-full px-4 pb-10 pt-20 sm:px-8 lg:ml-[16.666667%] lg:w-5/6 lg:pt-8" aria-busy={loading}>
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h1 className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-4xl font-bold text-transparent">Estadísticas</h1>
            <p className="mt-2 text-gray-400">Datos agregados de la plataforma y actividad diaria de los últimos {stats?.periodDays ?? 30} días.</p>
          </header>

          {loading && <p className="rounded-lg border border-gray-800 bg-gray-900 p-5 text-gray-300" role="status">Cargando estadísticas…</p>}
          {error && <p className="rounded-lg border border-red-800 bg-red-950/40 p-5 text-red-200" role="alert">{error}</p>}

          {!loading && !error && stats && (
            <>
              <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map(({ key, label, icon: Icon, color }) => (
                  <article key={key} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm text-gray-400">{label}</h2>
                        <p className="mt-1 text-3xl font-bold">{numberFormat.format(stats.totals[key])}</p>
                      </div>
                      <Icon aria-hidden="true" className={`${color} text-2xl`} />
                    </div>
                  </article>
                ))}
              </div>

              <section aria-labelledby="activity-trends-title" className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 id="activity-trends-title" className="text-2xl font-semibold">Actividad diaria</h2>
                  <p className="inline-flex items-center gap-2 text-sm text-gray-400"><FaCalendarAlt aria-hidden="true" />Últimos {stats.periodDays} días</p>
                </div>
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  {metrics.map(({ key, label, fill }) => {
                    const points = stats.trends[key];
                    const maximum = Math.max(1, ...points.map(point => point.count));
                    return (
                      <article key={key} className="rounded-xl border border-gray-800 bg-gray-900 p-5">
                        <h3 className="mb-5 font-semibold">{label}</h3>
                        {points.length ? (
                          <div className="flex h-36 items-end gap-1 border-b border-gray-700 pb-1" role="img" aria-label={`${label} por día durante los últimos ${stats.periodDays} días`}>
                            {points.map(point => (
                              <div key={point.date} className="group relative flex h-full min-w-0 flex-1 items-end" title={`${point.date}: ${numberFormat.format(point.count)}`}>
                                <span className={`w-full rounded-t-sm ${fill} opacity-75 transition-opacity group-hover:opacity-100`} style={{ height: `${Math.max(point.count ? 4 : 0, (point.count / maximum) * 100)}%` }} />
                                <span className="sr-only">{point.date}: {numberFormat.format(point.count)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="flex h-36 items-center justify-center text-sm text-gray-400">No hay actividad registrada.</p>
                        )}
                        {points.length > 0 && <div className="mt-2 flex justify-between text-xs text-gray-500"><span>{points[0].date}</span><span>{points[points.length - 1].date}</span></div>}
                      </article>
                    );
                  })}
                </div>
              </section>
              <p className="mt-8 text-right text-xs text-gray-500">Actualizado: {new Date(stats.generatedAt).toLocaleString('es-ES')}</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

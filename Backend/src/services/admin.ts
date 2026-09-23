import { QueryTypes } from 'sequelize';
import { ChatMessages, Post, User, VideoCalls } from '../models';
import { sequelize } from '../config/database';

type DailyCountRow = { date: string | Date; count: number | string };
type MetricName = 'users' | 'posts' | 'messages' | 'videoCalls';

export interface AdminStats {
    generatedAt: string;
    periodDays: number;
    totals: Record<MetricName, number>;
    trends: Record<MetricName, Array<{ date: string; count: number }>>;
}

const metricQueries: Record<MetricName, string> = {
    users: `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM users WHERE created_at >= :since AND deleted_at IS NULL GROUP BY 1 ORDER BY 1`,
    posts: `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM posts WHERE created_at >= :since AND deleted_at IS NULL GROUP BY 1 ORDER BY 1`,
    messages: `SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM chat_messages WHERE created_at >= :since GROUP BY 1 ORDER BY 1`,
    videoCalls: `SELECT to_char(date_trunc('day', started_at), 'YYYY-MM-DD') AS date, COUNT(*)::int AS count
        FROM video_calls WHERE started_at >= :since GROUP BY 1 ORDER BY 1`
};

export class AdminService {
    public async getStats(): Promise<AdminStats> {
        const periodDays = 30;
        const since = new Date();
        since.setUTCHours(0, 0, 0, 0);
        since.setUTCDate(since.getUTCDate() - (periodDays - 1));

        const [users, posts, messages, videoCalls, userRows, postRows, messageRows, videoCallRows] = await Promise.all([
            User.count(),
            Post.count(),
            ChatMessages.count(),
            VideoCalls.count(),
            this.getDailyCounts(metricQueries.users, since),
            this.getDailyCounts(metricQueries.posts, since),
            this.getDailyCounts(metricQueries.messages, since),
            this.getDailyCounts(metricQueries.videoCalls, since)
        ]);

        const dates = Array.from({ length: periodDays }, (_, index) => {
            const date = new Date(since);
            date.setUTCDate(since.getUTCDate() + index);
            return date.toISOString().slice(0, 10);
        });

        return {
            generatedAt: new Date().toISOString(),
            periodDays,
            totals: { users, posts, messages, videoCalls },
            trends: {
                users: this.fillDailyCounts(dates, userRows),
                posts: this.fillDailyCounts(dates, postRows),
                messages: this.fillDailyCounts(dates, messageRows),
                videoCalls: this.fillDailyCounts(dates, videoCallRows)
            }
        };
    }

    private async getDailyCounts(query: string, since: Date): Promise<DailyCountRow[]> {
        return sequelize.query<DailyCountRow>(query, {
            replacements: { since },
            type: QueryTypes.SELECT
        });
    }

    private fillDailyCounts(dates: string[], rows: DailyCountRow[]) {
        const countsByDate = new Map(rows.map(row => [
            typeof row.date === 'string' ? row.date.slice(0, 10) : row.date.toISOString().slice(0, 10),
            Number(row.count)
        ]));
        return dates.map(date => ({ date, count: countsByDate.get(date) ?? 0 }));
    }
}

export const adminService = new AdminService();

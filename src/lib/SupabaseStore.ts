import { Store } from 'express-session';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SessionData } from 'express-session';
import logger from "../utils/logger";

interface SupabaseStoreOptions {
  supabaseUrl: string;
  supabaseKey: string;
  tableName?: string;
  ttl?: number; // Time to live in seconds
}

class SupabaseStore extends Store {
  private supabase: SupabaseClient;
  private tableName: string;
  private ttl: number;

  constructor(options: SupabaseStoreOptions) {
    super();
    this.supabase = createClient(options.supabaseUrl, options.supabaseKey);
    this.tableName = options.tableName || 'sessions';
    this.ttl = options.ttl || 1209600; // Default to 2 weeks
  }

  async get(sid: string, callback: (err: any, session?: SessionData | null) => void): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('sess')
        .eq('sid', sid)
        .limit(1)

      if (error) {
        // logger.error(error)
        return callback(error);
      }

      if (!data?.length) {
        return callback(null, null);
      }

      return callback(null, JSON.parse(data[0].sess));
    } catch (err) {
      logger.error(err)
      return callback(err);
    }
  }

  async set(sid: string, sess: SessionData, callback: (err?: any) => void = () => {}): Promise<void> {
    try {
      const expire = new Date(sess.cookie?.expires || Date.now() + this.ttl * 1000);
      const session = { sid, sess, expire };

      const { error } = await this.supabase
        .from(this.tableName)
        .upsert(session, { onConflict: 'sid' });

      if (error) {
        logger.error(error)
        return callback(error);
      }

      return callback();
    } catch (err) {
      logger.error(err)
      return callback(err);
    }
  }

  async destroy(sid: string, callback: (err?: any) => void = () => {}): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('sid', sid);

      if (error) {
        logger.error(error)
        return callback(error);
      }

      return callback();
    } catch (err) {
      logger.error(err)
      return callback(err);
    }
  }

  async clear(callback: (err?: any) => void = () => {}): Promise<void> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete();

      if (error) {
        logger.error(error)
        return callback(error);
      }

      return callback();
    } catch (err) {
      logger.error(err)
      return callback(err);
    }
  }

  async length(callback: (err: any, length?: number) => void): Promise<void> {
    try {
      const { count, error } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact' });

      if (error) {
        return callback(error);
      }

      return callback(null, count || 0);
    } catch (err) {
      return callback(err);
    }
  }

  async all(callback: (err: any, sessions?: SessionData[] | { [sid: string]: SessionData } | null) => void): Promise<void> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('sess');

      if (error) {
        return callback(error);
      }

      return callback(null, data.map((row: any) => row.sess));
    } catch (err) {
      return callback(err);
    }
  }
}

export default SupabaseStore;

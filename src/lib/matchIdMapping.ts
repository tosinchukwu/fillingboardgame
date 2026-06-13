/**
 * Match ID mapping utilities for storing and retrieving match ID mappings
 * Syncs with fillgame via shared match_id_mapping table
 * Uses numeric IDs only for consistency
 */

import { supabase } from './supabase';

/**
 * Save match ID mapping to Supabase (shared with fillgame via match_id_mapping table)
 * Maps numeric ID to match type (casual/official)
 * @param numericMatchId - Numeric match ID from contract
 * @param isCasual - Whether this is a casual match
 * @param chainId - Blockchain chain ID
 * @param creatorAddress - Creator wallet address
 */
export async function saveMatchMetadata(
  numericMatchId: string | number | bigint,
  isCasual: boolean,
  chainId: number,
  creatorAddress: string
): Promise<void> {
  try {
    const numericId = Number(numericMatchId);
    
    const { error } = await supabase.from('match_id_mapping').insert({
      numeric_id: numericId,
      is_casual: isCasual,
      chain_id: chainId,
      creator_address: creatorAddress.toLowerCase(),
    });

    if (error) {
      console.error('[fillgamedart] Error saving match metadata:', error);
      // Don't throw - metadata is optional
    }
  } catch (err) {
    console.error('[fillgamedart] Failed to save match metadata:', err);
    // Silently fail - metadata is optional, shouldn't break match creation
  }
}

/**
 * Get match type from shared Supabase mapping table
 * Fetches from match_id_mapping (shared with fillgame) - serves as fallback when on-chain read fails
 * @param numericMatchId - Numeric match ID to look up
 * @returns 'casual' or 'official', or undefined if not found
 */
export async function getMatchType(numericMatchId: string | number): Promise<'casual' | 'official' | undefined> {
  try {
    const numericId = Number(numericMatchId);
    const { data, error } = await supabase
      .from('match_id_mapping')
      .select('is_casual')
      .eq('numeric_id', numericId)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') {
        console.error('[fillgamedart] Error fetching match type from Supabase:', error);
      }
      return undefined;
    }

    return data?.is_casual ? 'casual' : 'official';
  } catch (err) {
    console.error('[fillgamedart] Failed to fetch match type:', err);
    return undefined;
  }
}

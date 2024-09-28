import { Request, Response } from "express";
import {supabase} from "../../db/utils";
import {extractReferralCode} from "../../utils/referral";
import logger from "../../utils/logger";

const login = async (req: Request, res: Response) => {
  const { wallet, referral } = req.body;

  try {
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('wallet', wallet)
      .single()

    if (!data) {
      data = {
        wallet: wallet,
        token: ''
      }
    }

    if (referral) {
      const { referrerToken, referralToken } = extractReferralCode(referral)
      const { data: existingClaimer } = await supabase
        .from('users')
        .select('*')
        .eq('token', referralToken)
        .single();

      if (existingClaimer) {
        throw new Error ('Referral code is used');
      }

      data = {
        wallet: wallet,
        token: referralToken,
        referral: referrerToken
      }

      const { data: referrerData, error } = await supabase
        .from('users')
        .select('referral_links')
        .eq('token', referrerToken)
        .single();

      if (error) {
        throw new Error (error.message);
      }

      if (!referrerData) {
        throw new Error ('Referrer data not found');
      }

      await supabase
        .from('users')
        .insert(data)

      await supabase
        .from('users')
        .update({
          referral_links: referrerData.referral_links.map((l: any) => ({
            ...l,
            owner: l.code === referral ? wallet : l.owner
          }))
        })
        .eq('token', referrerToken)
    }

    req.session.wallet = wallet;
    req.session.chain = 'solana';
    req.session.token = data.token || '';
    req.session.role = data.role || 'none';
    req.session.verified = !!data.token;
    req.session.save();

    return res.json(data)
  } catch (e:any) {
    logger.error(e.message);
    return res.status(401).json({
      error: e.message
    })
  }
}

export default login;
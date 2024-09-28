import {Request, Response} from "express";
import {supabase} from "../../db/utils";
import {extractReferralCode} from "../../utils/referral";

export default async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const { data } = await supabase
      .from('users')
      .select('wallet')
      .eq('token', token)
      .single()

    if (!data) {
      return res.status(401).send('Invalid token')
    }

    if (data?.wallet && req.session.wallet !== data.wallet) {
      return res.status(401).send('Wallet already connected to other token')
    }

    req.session.token = token;
    req.session.role = 'none';
    req.session.chain = 'solana';
    req.session.verified = true;
    req.session.save();

    return res.status(200).send('Authorized')
  } catch (e: any) {
    return res.status(500).send('Internal Server Error: ' + e.message)
  }
}
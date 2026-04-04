import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS設定
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // CORS プリフライトリクエストに対応
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, redirect_uri } = await req.json()
    const CLIENT_ID = Deno.env.get('LINE_CHANNEL_ID')!
    const CLIENT_SECRET = Deno.env.get('LINE_CHANNEL_SECRET')!
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!

    console.log('--- LINE Auth Start ---')
    console.log('Code:', code)
    console.log('Redirect URI:', redirect_uri)

    // 1. LINEの認証コードをトークンに交換
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    })
    
    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('LINE Token Error:', err)
      throw new Error(`LINE Token Error: ${err}`)
    }
    const tokens = await tokenRes.json()

    // 2. LINEプロフィール取得
    const profRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })
    const profile = await profRes.json()
    console.log('LINE Profile:', profile.displayName)

    // 3. Supabase Auth管理
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
    const email = `line_${profile.userId}@line.tunedrop.example`
    
    // ユーザー作成（既にいる場合はエラーになるが、それを無視する）
    console.log('Ensuring user exists:', email)
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      email_confirm: true,
      user_metadata: { 
        full_name: profile.displayName, 
        avatar_url: profile.pictureUrl 
      }
    })

    // 既に登録済み（422 email_exists）以外のエラーが起きた場合のみ例外を投げる
    if (createError && (createError as any).status !== 422) {
      console.error('User creation failed:', createError)
      throw createError
    }

    // ログイン用のリンクを生成
    console.log('Generating link for:', email)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email
    })

    if (linkError) {
      console.error('Link generation failed:', linkError)
      throw linkError
    }

    console.log('Success!')
    return new Response(
      JSON.stringify({ 
        token_hash: linkData.properties.hashed_token,
        type: 'magiclink'
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (err) {
    console.error('Runtime Error:', err.message)
    return new Response(
      JSON.stringify({ error: err.message }), 
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /* ─── Login ─── */
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants fournis sont incorrects.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type'   => 'Bearer',
            'user'         => $user,
        ]);
    }

    /* ─── Forgot Password: send reset email ─── */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ], [
            'email.required' => "L'adresse email est obligatoire.",
            'email.email'    => "L'adresse email est invalide.",
        ]);

        $status = Password::sendResetLink($request->only('email'));

        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'Un lien de réinitialisation a été envoyé à votre adresse email.',
            ]);
        }

        // Email not found in database
        return response()->json([
            'message' => 'Aucun compte associé à cette adresse email.',
        ], 404);
    }

    /* ─── Reset Password: handle token from email link ─── */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'token'                 => 'required',
            'email'                 => 'required|email',
            'password'              => 'required|min:6|confirmed',
        ], [
            'token.required'        => 'Le token de réinitialisation est manquant.',
            'email.required'        => "L'adresse email est obligatoire.",
            'email.email'           => "L'adresse email est invalide.",
            'password.required'     => 'Le nouveau mot de passe est obligatoire.',
            'password.min'          => 'Le mot de passe doit contenir au moins 6 caractères.',
            'password.confirmed'    => 'Les mots de passe ne correspondent pas.',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password'       => Hash::make($password),
                    'remember_token' => Str::random(60),
                ])->save();

                // Revoke all Sanctum tokens → user must re-login
                $user->tokens()->delete();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.',
            ]);
        }

        return response()->json([
            'message' => 'Le lien de réinitialisation est invalide ou expiré.',
        ], 422);
    }

    /* ─── Logout ─── */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnecté avec succès.']);
    }

    /* ─── Current User ─── */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}

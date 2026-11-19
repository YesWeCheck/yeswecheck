<?php

namespace App\Http\Controllers;

use App\Rules\DeliverableEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SignupController extends Controller
{
    public function create()
    {
        return view('signup');
    }

    public function store(Request $request)
    {
        $email = new DeliverableEmail();

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['bail', 'required', 'email', $email],
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput()->with('email_suggestion', $email->suggestion);
        }

        // Create the account here. Keep $email->flag if you want to review those sign-ups later.
        return redirect('/welcome');
    }
}

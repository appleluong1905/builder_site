<?php

namespace App\Http\Controllers;

use App\User;
use App\Site;
use App\Page;
use App\Frame;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\View\View;
use Session;
use Mail;

class UserController extends Controller
{
	/**
	 * Show list of user
	 */
	public function getUserList()
	{
		$users = array();
		$tempUsers = User::orderBy('id', 'asc')->get();
		foreach ($tempUsers as $user)
		{
			$tempData = array();
			$tempData['userData'] = $user;
			$siteData = Site::where('user_id', $user->id)->where('site_trashed', 0)->orderBy('id', 'asc')->get()->toArray();
			//array holding all sites and associated data
			$allSites = array();
			// Get page data
			foreach ($siteData as $site)
			{
				$temp = array();
				$temp['siteData'] = $site;

				// Get the number of pages
				$pages = Page::where('site_id', $site['id'])->orderBy('id', 'asc')->get()->toArray();
				$temp['nrOfPages'] = count($pages);

				// Grab the last frame of site
				$indexPage = Page::where('name', 'index')->where('site_id', $site['id'])->orderBy('id', 'asc')->get()->toArray();
				if (count($indexPage) > 0)
				{
					//dd($indexPage);
					$frame = Frame::where('page_id', $indexPage[0]['id'])->where('revision', 0)->orderBy('id', 'asc')->first();
					if ( ! empty($frame))
					{
						$temp['lastFrame'] = $frame->toArray();
					}
					else
					{
						$temp['lastFrame'] = '';
					}
				}
				else
				{
					$temp['lastFrame'] = '';
				}
				$allSites[] = $temp;
			}
			$tempData['site'] = $allSites;
			$users[] = $tempData;
		}

		//dd($users);
		//dd($siteData);
		return view('users.users', ['users' => $users]);
	}

	/**
	 * Create New User
	 * @param  Request $request
	 * @return JSON
	 */
	public function postUserCreate(Request $request)
	{
		// $this->validate($request, [
		// 	'email' => 'required|email|unique:users',
		// 	'first_name' => 'required|max:120',
		// 	'last_name' => 'required|max:120',
		// 	'password' => 'required|confirmed|min:6',
		// 	]);
		$email = $request['email'];
		$first_name = $request['first_name'];
		$last_name = $request['last_name'];
		$password = bcrypt($request['password']);
		if (isset($request['type']))
		{
			$type = $request['type'];
		}
		else
		{
			$type = 'user';
		}

		$user = new User();
		$user->email = $email;
		$user->first_name = $first_name;
		$user->last_name = $last_name;
		$user->active = 1;
		$user->password = $password;
		$user->type = $type;
		$user->save();

		$users = User::orderBy('id', 'asc')->get();
		$temp_user = View('partials.users', array('users' => $users));
		$return['users'] = $temp_user->render();
		$temp['header'] = 'Hooray';
		$temp['content'] = 'The new account was created successfully!';
		$view = View('partials.success', array('data' => $temp));
		$return['responseHTML'] = $view->render();
		$return['responseCode'] = 1;

		return response()->json($return);
	}

	/**
	 * Update Existing User
	 * @param  Request $request
	 * @return JSON
	 */
	public function postUserUpdate(Request $request)
	{
		// $this->validate($request, [
		// 	'email' => 'required|email|unique:users',
		// 	'first_name' => 'required|max:120',
		// 	'last_name' => 'required|max:120',
		// 	'password' => 'required|confirmed|min:6',
		// 	]);
		$user_id = $request['user_id'];
		$email = $request['email'];
		$password = bcrypt($request['password']);
		if (isset($request['type']))
		{
			$type = $request['type'];
		}
		else
		{
			$type = 'user';
		}

		$user = User::where('id', $user_id)->first();
		$user->email = $email;
		$user->password = $password;
		$user->type = $type;
		$user->update();

		$update_user = User::where('id', $user_id)->first();
		$temp_user = View('partials.userdetails', array('user' => $update_user));
		$return['userDetailForm'] = $temp_user->render();
		$temp['header'] = 'Hooray';
		$temp['content'] = 'The account was updated successfully!';
		$view = View('partials.success', array('data' => $temp) );
		$return['responseHTML'] = $view->render();
		$return['responseCode'] = 1;

		return response()->json($return);
	}

	/**
	 * Send Password Reset Email
	 * @param  Integer $user_id
	 * @return JSON
	 */
	public function getPasswordResetEmail($user_id)
	{
		$user = User::where('id', $user_id)->first();
		$random = str_random(40);
		$user->forgotten_password_code = $random;
		$user->update();
		$data['email'] = $user->email;
		$data['code'] = $random;

		Mail::send('auth.email.forgot_password', $data, function ($message) use ($user) {
			$message->from('tapan@chillyorange.com', 'SiteBuilder Laravel');
			$message->to($user->email);
			$message->subject('Forgot Password');
		});

		if (count(Mail::failures()) > 0)
		{
			$temp['header'] = 'Ouch!';
			$temp['content'] = 'Something went wrong when trying to sent the password reset email.';
			$view = View('partials.error', array('data' => $temp) );
			$return['responseHTML'] = $view->render();
			$return['responseCode'] = 0;
		}
		else
		{
			$temp['header'] = 'Hooray!';
			$temp['content'] = 'A reset password email was sent to ' . $user->email;
			$view = View('partials.success', array('data' => $temp) );
			$return['responseHTML'] = $view->render();
			$return['responseCode'] = 1;
		}

		return response()->json($return);
	}

	/**
	 * Reset password
	 * @param  string $code
	 */
	public function getPasswordResetCode($code)
	{
		$user = User::where('forgotten_password_code', $code)->first();
		//dd($user);
		if ($user->count() > 0)
		{
			return view('auth.reset_password', ['user' => $user]);
		}
		else
		{
			abort(404);
		}
	}

	/**
	 * Update New Password
	 * @param  Request $request
	 */
	public function postPasswordReset(Request $request)
	{
		$user = User::where('id', $request->user_id)->first();
		$user->password = bcrypt($request['new']);
		//$user->update();

		if ($user->update())
		{
			Session::flash('success', 'Password reset successfully. You can login now.');
		}
		else
		{
			Session::flash('error', 'Something went wrong when trying to reset your password. Please try some time later.');
		}

		return redirect()->route('home');
	}

	/**
	 * Send Password Reset Email from forget password option
	 * @param  Request $request
	 * @return JSON
	 */
	public function postRecoverPassword(Request $request)
	{
		//dd($request);
		$user = User::where('email', $request->email)->first();
		//dd($user);
		$random = str_random(40);
		$user->forgotten_password_code = $random;
		$user->update();
		$data['email'] = $user->email;
		$data['code'] = $random;

		Mail::send('auth.email.forgot_password', $data, function ($message) use ($user) {
			$message->from('tapan@chillyorange.com', 'SiteBuilder Laravel');
			$message->to($user->email);
			$message->subject('Forgot Password');
		});

		if (count(Mail::failures()) > 0)
		{
			Session::flash('error', 'Something went wrong when trying to sent the password reset email.');
		}
		else
		{
			Session::flash('success', 'A reset password email was sent to ' . $user->email);
		}

		return redirect()->route('forgot.password');
	}

	/**
	 * Delete User
	 * @param  Integer $user_id
	 */
	public function getUserDelete($user_id)
	{
		$user = User::where('id', $user_id)->first();
		if (Auth::user()->type == 'admin')
		{
			$user->delete();
		}

		return redirect()->route('users');
	}

	/**
	 * Enable or Disable User
	 * @param  Integer $user_id
	 */
	public function getUserEnableDisable($user_id)
	{
		$user = User::where('id', $user_id)->first();
		if (Auth::user()->type == 'admin')
		{
			if ($user->active == 1)
			{
				$user->active = 0;
				$user->update();
				Session::flash('success', 'The user account has been de-activated; this user can no longer login.');
			}
			else
			{
				$user->active = 1;
				$user->update();
				Session::flash('success', 'The user account has been activated; this user can now login and create web sites.');
			}
		}
		else
		{
			Session::flash('success', 'You need to be admin to do this.');
		}

		return redirect()->route('users');
	}

	/**
	 * Update account first name and last name
	 * @param  Request $request
	 * @return JSON
	 */
	public function postUAccount(Request $request)
	{
		if (Auth::user()->id != $request->input('userID'))
		{
			die('You must be the account owner to do this');
		}

		$validator = Validator::make($request->all(), [
			'userID' => 'required',
			'firstname' => 'required|max:255',
			'lastname' => 'required|max:255',
			]);
		if ($validator->fails())
		{
			$temp = array();
			$temp['header'] = "Ouch! Something went wrong:";
			$temp['content'] = "Something went wrong when trying to update your details.";

			$return = array();
			$return['responseCode'] = 0;
			$view = View('partials.error', array('data' => $temp));
			$return['responseHTML'] = $view->render();

			die(json_encode($return));
		}

		$user = User::where('id', $request->input('userID'))->first();
		$user->first_name = trim($request->input('firstname'));
		$user->last_name = trim($request->input('lastname'));
		$user->update();

		$temp = array();
		$temp['header'] = "Hooray!";
		$temp['content'] = "Your account details were updated successfully.";

		$return = array();
		$return['responseCode'] = 1;
		$view = View('partials.success', array('data' => $temp));
		$return['responseHTML'] = $view->render();

		die(json_encode($return));
	}

	/**
	 * Update account's login credentials
	 * @param  Request $request
	 * @return JSON
	 */
	public function postULogin(Request $request)
	{
		if (Auth::user()->id != $request->input('userID'))
		{
			die('You must be the account owner to do this');
		}

		$validator = Validator::make($request->all(), [
			'userID' => 'required',
			'email' => 'required|email',
			'password' => 'required',
			]);
		if ($validator->fails())
		{
			$temp = array();
			$temp['header'] = "Ouch! Something went wrong:";
			$temp['content'] = "Something went wrong when trying to update your details.";

			$return = array();
			$return['responseCode'] = 0;
			$view = View('partials.error', array('data' => $temp));
			$return['responseHTML'] = $view->render();

			die(json_encode($return));
		}

		$user = User::where('id', $request->input('userID'))->first();
		$user->email = trim($request->input('email'));
		$user->password = bcrypt(trim($request->input('password')));
		$user->update();

		$temp = array();
		$temp['header'] = "Hooray!";
		$temp['content'] = "Your account details were updated successfully.";

		$return = array();
		$return['responseCode'] = 1;
		$view = View('partials.success', array('data' => $temp));
		$return['responseHTML'] = $view->render();

		die(json_encode($return));
	}

	/**
	 * User Sign-up process
	 * @param  Request $request
	 */
	public function postSignUp(Request $request)
	{
		$this->validate($request, [
			'email' => 'required|email|unique:users',
			'first_name' => 'required|max:120',
			'last_name' => 'required|max:120',
			'password' => 'required|confirmed|min:6',
			'password_confirmation' => 'required'
			]);
		$code = $request->input('CaptchaCode');
		$isHuman = captcha_validate($code);

		if ($isHuman)
		{
			$email = $request['email'];
			$first_name = $request['first_name'];
			$last_name = $request['last_name'];
			$password = bcrypt($request['password']);

			$user = new User();
			$user->email = $email;
			$user->first_name = $first_name;
			$user->last_name = $last_name;
			$user->active = 1;
			$user->password = $password;

			$user->save();

			Session::flash('message', 'Register successfully.');
			return redirect()->route('home');
		}
		else
		{
			Session::flash('message', 'Captcha value mismatched.');
			return redirect()->route('signup.link');
		}
	}

	/**
	 * User sign-in process
	 * @param  Request $request
	 */
	public function postSignIn(Request $request)
	{
		$this->validate($request, [
			'email' => 'required',
			'password' => 'required'
			]);

		if (Auth::attempt(['email' => $request['email'], 'password' => $request['password'], 'active' => 1]))
		{
			return redirect()->route('dashboard');
		}
		return redirect()->back()->with('message', 'Email address and Password mismatch or account not yet activated.');
	}

	/**
	 * User Logout process
	 */
	public function getLogout()
	{
		Auth::logout();
		return redirect()->route('home');
	}


}
<?php

/*
|--------------------------------------------------------------------------
| Application Routes
|--------------------------------------------------------------------------
|
| Here is where you can register all of the routes for an application.
| It's a breeze. Simply tell Laravel the URIs it should respond to
| and give it the controller to call when that URI is requested.
|
*/

// Login registration section route
Route::get('/', function () {
	return view('auth.login');
})->name('home');

Route::get('/forgot-password', function () {
	return view('auth.forgot_password');
})->name('forgot.password');

Route::post('/recover-password', [
	'uses' => 'UserController@postRecoverPassword',
	'as' => 'recover.password'
	]);

Route::get('/user-pw-reset-email/{user_id}', [
	'uses' => 'UserController@getPasswordResetEmail',
	'as' => 'user-pw-reset-email'
	]);

Route::get('/user-pw-reset-code/{code}', [
	'uses' => 'UserController@getPasswordResetCode',
	'as' => 'user-pw-reset-code'
	]);

Route::post('/user-pw-reset', [
	'uses' => 'UserController@postPasswordReset',
	'as' => 'user-pw-reset'
	]);

Route::get('/signup', function () {
	return view('auth.register_user');
})->name('signup');

Route::post('/signup', [
	'uses' => 'UserController@postSignUp',
	'as' => 'signup'
	]);

Route::post('/signin', [
	'uses' => 'UserController@postSignIn',
	'as' => 'signin'
	]);

Route::get('/logout', [
	'uses' => 'UserController@getLogout',
	'as' => 'logout'
	]);

// Dashboard section
Route::get('/dashboard', [
	'uses' => 'SiteController@getDashboard',
	'as' => 'dashboard',
	'middleware' => 'auth'
	]);

Route::get('/site/trash/{site_id}', [
	'uses' => 'SiteController@getTrash',
	'as' => 'site.trash',
	'middleware' => 'auth'
	]);

// Site section route
Route::get('/site-create', [
	'uses' => 'SiteController@getSiteCreate',
	'as' => 'site-create',
	'middleware' => 'auth'
	]);

Route::get('/site/{site_id}', [
	'uses' => 'SiteController@getSite',
	'as' => 'site',
	'middleware' => 'auth'
	]);

Route::post('/site/save', [
	'uses' => 'SiteController@postSave',
	'as' => 'site-save',
	'middleware' => 'auth'
	]);

Route::get('/site/getframe/{frame_id}', [
	'uses' => 'SiteController@getFrame',
	'as' => 'getframe',
	'middleware' => 'auth'
	]);

Route::get('/siteData', [
	'uses' => 'SiteController@getSiteData',
	'as' => 'siteData',
	'middleware' => 'auth'
	]);

Route::get('/siteAjax/{site_id}', [
	'uses' => 'SiteController@getSiteAjax',
	'as' => 'siteAjax',
	'middleware' => 'auth'
	]);

// Revision section route
Route::get('/site/getRevisions/{site_id}/{page}', [
	'uses' => 'SiteController@getRevisions',
	'as' => 'getRevisions',
	'middleware' => 'auth'
	]);

Route::get('/site/rpreview/{site_id}/{datetime}/{page}', [
	'uses' => 'SiteController@getRevisionPreview',
	'as' => 'revision.preview',
	'middleware' => 'auth'
	]);

Route::get('/deleterevision/{site_id}/{datetime}/{page}', [
	'uses' => 'SiteController@getRevisionDelete',
	'as' => 'revision.delete',
	'middleware' => 'auth'
	]);

Route::get('/restorerevision/{site_id}/{datetime}/{page}', [
	'uses' => 'SiteController@getRevisionRestore',
	'as' => 'revision.restore',
	'middleware' => 'auth'
	]);

// Publish and export section
Route::post('/site/export', [
	'uses' => 'SiteController@postExport',
	'as' => 'site.export',
	'middleware' => 'auth'
	]);

Route::post('/site/publish/{type?}', [
	'uses' => 'SiteController@postPublish',
	'as' => 'site.publish',
	'middleware' => 'auth'
	]);

// FTP section route
Route::post('/site/connect', [
	'uses' => 'SiteController@postFTPConnect',
	'as' => 'ftp.connect',
	'middleware' => 'auth'
	]);

Route::post('/site/ftptest', [
	'uses' => 'SiteController@postFTPTest',
	'as' => 'ftp.test',
	'middleware' => 'auth'
	]);

Route::get('/test', [
	'uses' => 'SiteController@getTest',
	'as' => 'site.test',
	'middleware' => 'auth'
	]);

// Live preview route
Route::post('/site/live/preview', [
	'uses' => 'SiteController@postLivePreview',
	'as' => 'live.preview',
	'middleware' => 'auth'
	]);

// Site and Page settings
Route::post('/siteAjaxUpdate', [
	'uses' => 'SiteController@postAjaxUpdate',
	'as' => 'siteAjaxUpdate',
	'middleware' => 'auth'
	]);

Route::post('/updatePageData', [
	'uses' => 'SiteController@postUpdatePageData',
	'as' => 'updatePageData',
	'middleware' => 'auth'
	]);

// User section route
Route::get('/users', [
	'uses' => 'UserController@getUserList',
	'as' => 'users',
	'middleware' => 'auth'
	]);

Route::post('/user-create', [
	'uses' => 'UserController@postUserCreate',
	'as' => 'user-create',
	'middleware' => 'auth'
	]);

Route::post('/user-update', [
	'uses' => 'UserController@postUserUpdate',
	'as' => 'user-update',
	'middleware' => 'auth'
	]);

Route::get('/user-delete/{user_id}', [
	'uses' => 'UserController@getUserDelete',
	'as' => 'user-delete',
	'middleware' => 'auth'
	]);

Route::get('/user-enable-disable/{user_id}', [
	'uses' => 'UserController@getUserEnableDisable',
	'as' => 'user-enable-disable',
	'middleware' => 'auth'
	]);

Route::post('/user/uaccount', [
	'uses' => 'UserController@postUAccount',
	'as' => 'user.uaccount',
	'middleware' => 'auth'
	]);

Route::post('/user/ulogin', [
	'uses' => 'UserController@postULogin',
	'as' => 'user.ulogin',
	'middleware' => 'auth'
	]);

// Settings section route
Route::get('/settings', [
	'uses' => 'SettingController@getSetting',
	'as' => 'settings',
	'middleware' => 'auth'
	]);

Route::post('/edit-settings', [
	'uses' => 'SettingController@postSetting',
	'as' => 'edit-settings',
	'middleware' => 'auth'
	]);

// Image Library section route
Route::get('/assets', [
	'uses' => 'AssetController@getAsset',
	'as' => 'assets',
	'middleware' => 'auth'
	]);

Route::post('/upload-image', [
	'uses' => 'AssetController@uploadImage',
	'as' => 'upload.image',
	'middleware' => 'auth'
	]);

Route::post('/image-upload-ajax', [
	'uses' => 'AssetController@imageUploadAjax',
	'as' => 'image.upload.ajax',
	'middleware' => 'auth'
	]);

Route::post('/delImage', [
	'uses' => 'AssetController@delImage',
	'as' => 'delImage',
	'middleware' => 'auth'
	]);
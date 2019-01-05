<?php

namespace App\Http\Controllers;

use App\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
	/**
	 * View settings value
	 */
	public function getSetting()
	{
		$settings = Setting::orderBy('id', 'asc')->get();
		return view('settings/settings', ['settings' => $settings]);
	}

	/**
	 * Update settings value
	 * @param  Request $request
	 */
	public function postSetting(Request $request)
	{
		$this->validate($request, [
			'elements_dir' => 'required',
			'images_dir' => 'required',
			'images_uploadDir' => 'required',
			'upload_allowed_types' => 'required',
			'upload_max_size' => 'required',
			'upload_max_width' => 'required',
			'upload_max_height' => 'required',
			'images_allowedExtensions' => 'required',
			'export_pathToAssets' => 'required',
			'export_fileName' => 'required',
			'index_page' => 'required',
			'language' => 'required',
			]);
		//var_dump($request);

		$request->session()->flash('success', 'Successfully updated!');

		$setting = Setting::where('name', 'elements_dir')->first();
		$setting->value = $request['elements_dir'];
		if ($setting->update())
		{
			$request->session()->flash('error', 'There was an error!');
		}

		$setting = Setting::where('name', 'images_dir')->first();
		$setting->value = $request['images_dir'];
		$setting->update();

		$setting = Setting::where('name', 'images_uploadDir')->first();
		$setting->value = $request['images_uploadDir'];
		$setting->update();

		$setting = Setting::where('name', 'upload_allowed_types')->first();
		$setting->value = $request['upload_allowed_types'];
		$setting->update();

		$setting = Setting::where('name', 'upload_max_size')->first();
		$setting->value = $request['upload_max_size'];
		$setting->update();

		$setting = Setting::where('name', 'upload_max_width')->first();
		$setting->value = $request['upload_max_width'];
		$setting->update();

		$setting = Setting::where('name', 'upload_max_height')->first();
		$setting->value = $request['upload_max_height'];
		$setting->update();

		$setting = Setting::where('name', 'images_allowedExtensions')->first();
		$setting->value = $request['images_allowedExtensions'];
		$setting->update();

		$setting = Setting::where('name', 'export_pathToAssets')->first();
		$setting->value = $request['export_pathToAssets'];
		$setting->update();

		$setting = Setting::where('name', 'export_fileName')->first();
		$setting->value = $request['export_fileName'];
		$setting->update();

		$setting = Setting::where('name', 'index_page')->first();
		$setting->value = $request['index_page'];
		$setting->update();

		$setting = Setting::where('name', 'language')->first();
		$setting->value = $request['language'];
		$setting->update();

		return redirect()->route('settings');
	}


}
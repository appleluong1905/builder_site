<?php

namespace Tapan29bd\LaravelInstaller\Helpers;

use Exception;
use Illuminate\Http\Request;

class EnvironmentManager
{
    /**
     * @var string
     */
    private $envPath;

    /**
     * @var string
     */
    private $envExamplePath;

    /**
     * Set the .env and .env.example paths.
     */
    public function __construct()
    {
        $this->envPath = base_path('.env');
        $this->envExamplePath = base_path('.env.example');
    }

    /**
     * Get the content of the .env file.
     *
     * @return string
     */
    public function getEnvContent()
    {
        if (!file_exists($this->envPath)) {
            if (file_exists($this->envExamplePath)) {
                copy($this->envExamplePath, $this->envPath);
            } else {
                touch($this->envPath);
            }
        }

        return file_get_contents($this->envPath);
    }

    /**
     * Save the edited content to the file.
     *
     * @param Request $input
     * @return string
     */
    public function saveFile(Request $input)
    {
        $message = trans('messages.environment.success');

        try {
            file_put_contents($this->envPath, $input->get('envConfig'));
        }
        catch(Exception $e) {
            $message = trans('messages.environment.errors');
        }

        return $message;
    }

    public function saveENV(Request $request)
    {
        //dd($request->input());
        // .env file path
        $env_template = base_path() . '/.env.example';
        $env_output = base_path() . '/.env';

        //dd($env_template);

        // Open the file
        $env_file = file_get_contents($env_template);
        //dd($env_file);

        $new  = str_replace("%HOSTNAME%", $request->input('hostname'), $env_file);
        $new  = str_replace("%USERNAME%", $request->input('username'), $new);
        $new  = str_replace("%PASSWORD%", $request->input('password'), $new);
        $new  = str_replace("%DATABASE%", $request->input('database'), $new);
        $new  = str_replace("%BASE_URL%", $request->input('url'), $new);

        // Write the new database.php file
        $handle = fopen($env_output,'w+');

        // Chmod the file, in case the user forgot
        @chmod($env_output,0777);

        // Verify file permissions
        if(is_writable($env_output))
        {
            // Write the file
            if(fwrite($handle, $new))
            {
                $message = trans('messages.environment.success');
            }
            else
            {
                $message = trans('messages.environment.errors');
            }

        }
        else
        {
            $message = trans('messages.environment.permission');
        }

        return $message;
    }
}

<?php

use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        DB::table('users')->insert([
        	'ip_address' => '127.0.0.1',
        	'email' => 'admin@admin.com',
        	'password' => bcrypt('password'),
        	'first_name' => 'Admin',
        	'last_name' => 'istrator',
        	'type' => 'admin',
        	'active' => 1,
        	'created_at' => date('Y-m-d H:i:s'),
        	'updated_at' => date('Y-m-d H:i:s')
        	]);
    }
}

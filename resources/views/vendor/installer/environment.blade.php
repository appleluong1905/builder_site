@extends('vendor.installer.layouts.master')

@section('title', trans('messages.environment.title'))

@section('container')

@if (session('message'))
<p class="alert">{{ session('message') }}</p>
@endif

<form method="post" action="{{ route('LaravelInstaller::environmentSave') }}" id="envForm">
    <input type="text" name="hostname" value="" placeholder="Database HostName" id="hostname">
    <input type="text" name="database" value="" placeholder="Database Name" id="database">
    <input type="text" name="username" value="" placeholder="Database Username" id="username">
    <input type="text" name="password" value="" placeholder="Database Password" id="password">
    <input type="text" name="url" value="{{ url('/') }}" placeholder="Public URL" id="url">

    {!! csrf_field() !!}
    <div class="buttons buttons--right" style="margin-top: 30px">
       <button class="button" type="submit">{{ trans('messages.next') }}</button>
   </div>
</form>

@if ( ! isset($environment['errors']))
<!-- <div class="buttons">
    <a class="button" href="{{ route('LaravelInstaller::requirements') }}">
        {{ trans('messages.next') }}
    </a>
</div> -->
@endif

@stop
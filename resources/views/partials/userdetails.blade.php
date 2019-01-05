<form class="form-horizontal" role="form" action="{{ route('user-update', ['user_id' => $user['userData']->id]) }}">
	<div class="form-group">
		<div class="col-md-12">
			<input type="text" class="form-control" id="email" name="email" placeholder="Email address" value="{{ $user['userData']->email }}">
		</div>
	</div>
	<div class="form-group">
		<div class="col-md-12">
			<input type="password" class="form-control" id="password" name="password" placeholder="Password" value="">
		</div>
	</div>
	<div class="form-group">
		<div class="col-md-6">
			<label class="checkbox" for="checkbox-admin-{{ $user['userData']->id }}" style="padding-top: 0px;">
				<input type="checkbox" value="yes" <?php if( $user['userData']['type'] == 'admin' ):?>checked<?php endif;?> name="type" data-toggle="checkbox" id="checkbox-admin-{{ $user['userData']->id }}">
				Admin permissions
			</label>
		</div>
	</div>
	<input type="hidden" name="user_id" value="{{ $user['userData']->id }}">
	<input type="hidden" name="_token" value="{{ Session::token() }}">
	<div class="form-group">
		<div class="col-md-12">
			<button type="button" class="btn btn-primary btn-embossed btn-block updateUserButton" data-userid="{{ $user['userData']->id }}"><span class="fui-check"></span> Update Details</button>
		</div>
	</div>
</form>
<div class="modal fade accountModal" id="accountModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	<div class="modal-dialog">
		<div class="modal-content">
			<div class="modal-header">
				<button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
				<h4 class="modal-title" id="myModalLabel"> My Account</h4>
			</div>
			<div class="modal-body padding-top-40">
				<ul class="nav nav-tabs nav-append-content">
					<li class="active"><a href="#myAccount"><span class="fui-user"></span> Account</a></li>
				</ul> <!-- /tabs -->
				<div class="tab-content">
					<div class="tab-pane active" id="myAccount">
						<form class="form-horizontal" role="form" id="account_details" >
							<div class="loader" style="display: none;">
								<img src="{{ URL::to('src/images/loading.gif') }}" alt="Loading...">
							</div>
							<div class="alerts"></div>
							<input type="hidden" name="userID" value="{{ Auth::user()->id }}">
							<div class="form-group">
								<label for="name" class="col-md-3 control-label">First name</label>
								<div class="col-md-9">
									<input type="text" class="form-control" id="firstname" name="firstname" placeholder="First name" value="{{ Auth::user()->first_name }}">
								</div>
							</div>
							<div class="form-group">
								<label for="name" class="col-md-3 control-label">Last name</label>
								<div class="col-md-9">
									<input type="text" class="form-control" id="lastname" name="lastname" placeholder="Last name" value="{{ Auth::user()->last_name }}">
								</div>
							</div>
							<div class="form-group">
								<div class="col-md-offset-3 col-md-9">
									<button type="button" class="btn btn-primary btn-embossed btn-block" id="accountDetailsSubmit"><span class="fui-check"></span> Update Details</button>
								</div>
							</div>
						</form>
						<hr class="dashed">
						<form class="form-horizontal" role="form" id="account_login">
							<div class="loader" style="display: none;">
								<img src="{{ URL::to('src/images/loading.gif') }}" alt="Loading...">
							</div>
							<div class="alerts"></div>
							<input type="hidden" name="userID" value="{{ Auth::user()->id }}">
							<div class="form-group">
								<label for="username" class="col-md-3 control-label">Username</label>
								<div class="col-md-9">
									<input type="text" class="form-control" id="email" name="email" placeholder="Username" value="{{ Auth::user()->email }}">
								</div>
							</div>
							<div class="form-group">
								<label for="password" class="col-md-3 control-label">Password</label>
								<div class="col-md-9">
									<input type="password" class="form-control" id="password" name="password" placeholder="Password" value="">
								</div>
							</div>
							<div class="form-group">
								<div class="col-md-offset-3 col-md-9">
									<button type="button" class="btn btn-primary btn-embossed btn-block" id="accountLoginSubmit"><span class="fui-check"></span> Update Details</button>
								</div>
							</div>
						</form>
					</div>
				</div> <!-- /tab-content -->
			</div><!-- /.modal-body -->
			<div class="modal-footer">
				<button type="button" class="btn btn-default" data-dismiss="modal"><span class="fui-cross"></span> Cancel &amp; Close</button>
			</div>
		</div><!-- /.modal-content -->
	</div><!-- /.modal-dialog -->
</div><!-- /.modal -->
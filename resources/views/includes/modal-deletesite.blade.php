<div class="modal fade deleteSiteModal" id="deleteSiteModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
	<div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>
                <h4 class="modal-title" id="myModalLabel"><span class="fui-info"></span> Are you sure?</h4>
            </div>
            <div class="modal-body">
                <div class="modal-alerts"></div>
                <div class="loader" style="display: none;">
                    <img src="{{ URL::to('src/images/loading.gif') }}" alt="Loading...">
                    Deleting site...
                </div>
                <p>Are you sure you want to delete this site?</p>
            </div><!-- /.modal-body -->
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal"><span class="fui-cross"></span> Cancel &amp; Close</button>
                <button type="button" class="btn btn-primary" id="deleteSiteButton"><span class="fui-check"></span> Delete Forever</button>
            </div>
        </div><!-- /.modal-content -->
    </div><!-- /.modal-dialog -->
</div><!-- /.modal -->
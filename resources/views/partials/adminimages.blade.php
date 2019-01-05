@foreach ($adminImages as $img)
    <div class="image">
        <div class="imageWrap">
            <img src="{{ $adminSrc }}/{{ $img }}">
            <div class="ribbon-wrapper-red"><div class="ribbon-red">Admin</div></div>
        </div>
        <div class="buttons clearfix">
            <button type="button" class="btn btn-info btn-embossed btn-block btn-sm useImage" data-url="{{ $dataURL }}/{{ $img }}"><span class="fui-export"></span> Insert Image</button>
        </div>
    </div><!-- /.image -->
@endforeach
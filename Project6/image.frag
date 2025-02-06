// make this 120 for the mac:
#version 330 compatibility

// lighting uniform variables -- these can be set once and left alone:
uniform sampler2D CubeUnit, ModelUnit;

in vec2 vST;

void
main( )
{
	vec3 backgroudRGB = texture(CubeUnit, vST).rgb;
	vec3 modelRGB = texture(ModelUnit, vST).rgb;
	if (modelRGB == vec3(0., 0., 0.))
		gl_FragColor = vec4(backgroudRGB, 1.);
	else 
		gl_FragColor = vec4(modelRGB, 1.);
}

